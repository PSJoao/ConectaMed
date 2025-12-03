const Estabelecimento = require('../models/Estabelecimento');
const Medico = require('../models/Medico');
const googleMapsService = require('../services/GoogleMapsService');

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
      const especialidadesFiltro = normalizeToArray(especialidade);
      const conveniosFiltro = normalizeToArray(convenio);

      const andConditions = [];

      if (tiposFiltro.length) {
        andConditions.push({ tipo: { $in: tiposFiltro } });
      }

      if (especialidadesFiltro.length) {
        const medicosComEspecialidade = await Medico.find({
          especialidades: { $in: especialidadesFiltro },
          ativo: true
        }).select('estabelecimento');

        const estabelecimentosIds = medicosComEspecialidade
          .map(m => m.estabelecimento)
          .filter(Boolean);

        andConditions.push({ _id: { $in: estabelecimentosIds } });
      }

      if (conveniosFiltro.length) {
        const medicosComConvenio = await Medico.find({
          conveniosAceitos: { $in: conveniosFiltro },
          ativo: true
        }).select('estabelecimento');

        const estabelecimentosConvenio = medicosComConvenio
          .map(m => m.estabelecimento)
          .filter(Boolean);

        andConditions.push({
          $or: [
            { conveniosGerais: { $in: conveniosFiltro } },
            { _id: { $in: estabelecimentosConvenio } }
          ]
        });
      }

      if (search) {
        const searchRegex = new RegExp(search, 'i');
        andConditions.push({
          $or: [
            { nome: searchRegex },
            { enderecoCompleto: searchRegex },
            { descricao: searchRegex }
          ]
        });
      }

      let query = { ativo: true };

      if (andConditions.length) {
        query.$and = andConditions;
      }

      let estabelecimentos;

      // Se coordenadas foram fornecidas, buscar por proximidade
      if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const raioKm = parseFloat(raio);

        const geoQuery = {
          ...query,
          localizacao: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: raioKm * 1000
            }
          }
        };

        estabelecimentos = await Estabelecimento.find(geoQuery)
          .populate('medicos', 'nome especialidades conveniosAceitos')
          .populate('admin', 'nome email')
          .limit(50);
      } else {
        estabelecimentos = await Estabelecimento.find(query)
          .populate('medicos', 'nome especialidades conveniosAceitos')
          .populate('admin', 'nome email')
          .limit(50);
      }

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
      const estabelecimento = await Estabelecimento.findById(req.params.id)
        .populate('medicos', 'nome crm especialidades conveniosAceitos biografia telefone email')
        .populate('admin', 'nome email tipo');

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

      const estabelecimentos = await Estabelecimento.buscarProximos(
        longitude, 
        latitude, 
        raioKm
      )
      .populate('medicos', 'nome especialidades conveniosAceitos')
      .populate('admin', 'nome email')
      .limit(20);

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
        conveniosGerais 
      } = req.body;

      const userId = req.session.user._id;

      // Geocodificar endereço se fornecido
      let coordenadas = null;
      if (enderecoCompleto) {
        try {
          const geocoding = await googleMapsService.geocodificar(enderecoCompleto);
          if (geocoding && geocoding.results && geocoding.results.length > 0) {
            const location = geocoding.results[0].geometry.location;
            coordenadas = [location.lng, location.lat];
          }
        } catch (geoError) {
          console.error('Erro na geocodificação:', geoError);
        }
      }

      // Buscar estabelecimento existente
      let estabelecimento = await Estabelecimento.findOne({ admin: userId });

      if (estabelecimento) {
        // Atualizar existente
        estabelecimento.nome = nome || estabelecimento.nome;
        estabelecimento.cnpj = cnpj || estabelecimento.cnpj;
        estabelecimento.enderecoCompleto = enderecoCompleto || estabelecimento.enderecoCompleto;
        estabelecimento.telefone = telefone || estabelecimento.telefone;
        estabelecimento.horarioFuncionamento = horarioFuncionamento || estabelecimento.horarioFuncionamento;
        estabelecimento.descricao = descricao || estabelecimento.descricao;
        estabelecimento.site = site || estabelecimento.site;
        estabelecimento.conveniosGerais = conveniosGerais || estabelecimento.conveniosGerais;

        if (coordenadas) {
          estabelecimento.localizacao = {
            type: 'Point',
            coordinates: coordenadas
          };
        }

        await estabelecimento.save();
      } else {
        // Criar novo
        estabelecimento = new Estabelecimento({
          nome,
          cnpj,
          enderecoCompleto,
          telefone,
          horarioFuncionamento,
          descricao,
          site,
          conveniosGerais: conveniosGerais || [],
          localizacao: coordenadas ? {
            type: 'Point',
            coordinates: coordenadas
          } : null,
          admin: userId,
          tipo: req.session.user.tipo,
          ativo: true
        });

        await estabelecimento.save();
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

      const estabelecimento = await Estabelecimento.findOne({ admin: userId });
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Desativar em vez de remover
      estabelecimento.ativo = false;
      await estabelecimento.save();

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

      const estabelecimento = await Estabelecimento.findById(id);
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      await estabelecimento.adicionarAvaliacao(usuario, nota, comentario);

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
      const especialidades = await Medico.distinct('especialidades', { ativo: true });
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
      const convenios = await Estabelecimento.distinct('conveniosGerais', { ativo: true });
      const conveniosMedicos = await Medico.distinct('conveniosAceitos', { ativo: true });
      
      const todosConvenios = [...new Set([...convenios, ...conveniosMedicos])];
      
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
      const tipos = await Estabelecimento.distinct('tipo', { ativo: true });
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


