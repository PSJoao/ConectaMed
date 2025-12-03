const {
  searchEstabelecimentos,
  getEstabelecimentosProximos,
  getEstabelecimentoDetalhado,
  updateEstabelecimentoByAdmin,
  createEstabelecimento,
  softDeleteEstabelecimentoByAdmin,
  findEstabelecimentoByAdmin,
  addAvaliacao,
  getDistinctEspecialidades,
  getDistinctConvenios,
  getDistinctTiposEstabelecimento,
} = require('../models/db');

const normalizeToArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
};

const estabelecimentoController = {
  // Buscar estabelecimentos com filtros
  async buscarEstabelecimentos(req, res) {
    try {
      const { 
        search, 
        especialidade, 
        convenio, 
        tipo, 
        lat, 
        lng, 
        raio = 10 
      } = req.query;

      const tiposFiltro = normalizeToArray(tipo).filter(t => ['clinica', 'orgao_publico'].includes(t));
      const conveniosFiltro = normalizeToArray(convenio);

      const estabelecimentos = await searchEstabelecimentos({
        search: search || null,
        tipos: tiposFiltro.length ? tiposFiltro : null,
        convenios: conveniosFiltro.length ? conveniosFiltro : null,
        latitude: lat ? parseFloat(lat) : null,
        longitude: lng ? parseFloat(lng) : null,
        raioKm: raio ? parseFloat(raio) : null,
      });

      res.json({
        success: true,
        data: estabelecimentos,
        total: estabelecimentos.length
      });

    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Buscar estabelecimento por ID
  async buscarPorId(req, res) {
    try {
      const estabelecimento = await getEstabelecimentoDetalhado(req.params.id);

      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      res.json({
        success: true,
        data: estabelecimento
      });

    } catch (error) {
      console.error('Erro ao buscar estabelecimento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Buscar estabelecimentos próximos
  async buscarProximos(req, res) {
    try {
      const { lat, lng } = req.params;
      const { raio = 10 } = req.query;

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const raioKm = parseFloat(raio);

      const estabelecimentos = await getEstabelecimentosProximos({
        latitude,
        longitude,
        raioKm,
      });

      res.json({
        success: true,
        data: estabelecimentos,
        total: estabelecimentos.length
      });

    } catch (error) {
      console.error('Erro ao buscar estabelecimentos próximos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Criar ou atualizar estabelecimento
  async criarOuAtualizar(req, res) {
    try {
      const { 
        nome, 
        cnpj, 
        enderecoCompleto, 
        telefone, 
        horarioFuncionamento, 
        descricao, 
        site,
        conveniosGerais,
        latitude,
        longitude 
      } = req.body;

      const userId = req.session.user._id;

      const latNum = latitude ? parseFloat(latitude) : null;
      const lngNum = longitude ? parseFloat(longitude) : null;

      // Buscar estabelecimento existente
      let estabelecimento = await findEstabelecimentoByAdmin(userId);

      if (estabelecimento) {
        // Atualizar existente
        estabelecimento = await updateEstabelecimentoByAdmin(userId, {
          nome,
          cnpj,
          enderecoCompleto,
          telefone,
          horarioFuncionamento,
          descricao,
          site,
          conveniosGerais: conveniosGerais || null,
          latitude: latNum,
          longitude: lngNum,
        });
      } else {
        // Criar novo
        estabelecimento = await createEstabelecimento({
          nome,
          cnpj,
          enderecoCompleto,
          telefone,
          horarioFuncionamento,
          descricao,
          site,
          conveniosGerais: conveniosGerais || [],
          latitude: latNum,
          longitude: lngNum,
          adminId: userId,
          tipo: req.session.user.tipo,
        });
      }

      res.json({
        success: true,
        message: 'Estabelecimento salvo com sucesso',
        data: estabelecimento
      });

    } catch (error) {
      console.error('Erro ao salvar estabelecimento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Remover estabelecimento
  async remover(req, res) {
    try {
      const userId = req.session.user._id;
      const estabelecimento = await findEstabelecimentoByAdmin(userId);
     
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Desativar em vez de remover
      await softDeleteEstabelecimentoByAdmin(userId);

      res.json({
        success: true,
        message: 'Estabelecimento removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover estabelecimento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Avaliar estabelecimento
  async avaliar(req, res) {
    try {
      const { id } = req.params;
      const { usuario, nota, comentario } = req.body;

      if (!usuario || !nota || nota < 1 || nota > 5) {
        return res.status(400).json({ 
          error: 'Dados de avaliação inválidos' 
        });
      }

      const estabelecimento = await getEstabelecimentoDetalhado(id);
     
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      await addAvaliacao(id, { usuarioNome: usuario, nota, comentario });

      res.json({
        success: true,
        message: 'Avaliação adicionada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao avaliar estabelecimento:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Obter especialidades únicas
  async obterEspecialidades(req, res) {
    try {
      const especialidades = await getDistinctEspecialidades();
      res.json({
        success: true,
        data: especialidades.sort()
      });
    } catch (error) {
      console.error('Erro ao obter especialidades:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Obter convênios únicos
  async obterConvenios(req, res) {
    try {
      const todosConvenios = await getDistinctConvenios();
      res.json({
        success: true,
        data: todosConvenios.sort()
      });
    } catch (error) {
      console.error('Erro ao obter convênios:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Obter tipos de estabelecimento
  async obterTipos(req, res) {
    try {
      const tipos = await getDistinctTiposEstabelecimento();
      res.json({
        success: true,
        data: tipos
      });
    } catch (error) {
      console.error('Erro ao obter tipos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Upload de fotos (placeholder)
  async uploadFotos(req, res) {
    try {
      // Implementar upload de fotos
      res.json({
        success: true,
        message: 'Upload de fotos implementado'
      });
    } catch (error) {
      console.error('Erro no upload de fotos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  }
};

module.exports = estabelecimentoController;


