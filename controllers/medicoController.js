const Medico = require('../models/Medico');
const Estabelecimento = require('../models/Estabelecimento');

const medicoController = {
  // Buscar médicos
  async buscarMedicos(req, res) {
    try {
      const { 
        search, 
        especialidade, 
        convenio, 
        estabelecimento 
      } = req.query;

      let query = { ativo: true };

      // Filtro por busca textual
      if (search) {
        query.$text = { $search: search };
      }

      // Filtro por especialidade
      if (especialidade) {
        query.especialidades = { $in: [especialidade] };
      }

      // Filtro por convênio
      if (convenio) {
        query.conveniosAceitos = { $in: [convenio] };
      }

      // Filtro por estabelecimento
      if (estabelecimento) {
        query.estabelecimento = estabelecimento;
      }

      const medicos = await Medico.find(query)
        .populate('estabelecimento', 'nome enderecoCompleto telefone')
        .sort({ nome: 1 })
        .limit(100);

      res.json({
        success: true,
        data: medicos,
        total: medicos.length
      });

    } catch (error) {
      console.error('Erro ao buscar médicos:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Buscar médico por ID
  async buscarPorId(req, res) {
    try {
      const medico = await Medico.findById(req.params.id)
        .populate('estabelecimento', 'nome enderecoCompleto telefone horarioFuncionamento');

      if (!medico) {
        return res.status(404).json({ 
          error: 'Médico não encontrado' 
        });
      }

      res.json({
        success: true,
        data: medico
      });

    } catch (error) {
      console.error('Erro ao buscar médico:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Criar médico
  async criar(req, res) {
    try {
      const { 
        nome, 
        crm, 
        especialidades, 
        conveniosAceitos, 
        biografia, 
        telefone, 
        email 
      } = req.body;

      const userId = req.session.user._id;

      // Buscar estabelecimento do usuário
      const estabelecimento = await Estabelecimento.findOne({ admin: userId });
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Verificar se CRM já existe
      const medicoExistente = await Medico.findOne({ crm });
      if (medicoExistente) {
        return res.status(400).json({ 
          error: 'CRM já cadastrado' 
        });
      }

      // Criar médico
      const medico = new Medico({
        nome,
        crm,
        especialidades: especialidades || [],
        conveniosAceitos: conveniosAceitos || [],
        biografia: biografia || '',
        telefone: telefone || '',
        email: email || '',
        estabelecimento: estabelecimento._id,
        ativo: true
      });

      await medico.save();

      // Adicionar médico ao estabelecimento
      estabelecimento.medicos.push(medico._id);
      await estabelecimento.save();

      res.status(201).json({
        success: true,
        message: 'Médico cadastrado com sucesso',
        data: medico
      });

    } catch (error) {
      console.error('Erro ao criar médico:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          error: 'CRM já cadastrado' 
        });
      }

      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Atualizar médico
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { 
        nome, 
        especialidades, 
        conveniosAceitos, 
        biografia, 
        telefone, 
        email 
      } = req.body;

      const userId = req.session.user._id;

      // Buscar estabelecimento do usuário
      const estabelecimento = await Estabelecimento.findOne({ admin: userId });
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Buscar médico
      const medico = await Medico.findOne({ 
        _id: id,
        estabelecimento: estabelecimento._id 
      });

      if (!medico) {
        return res.status(404).json({ 
          error: 'Médico não encontrado' 
        });
      }

      // Atualizar dados
      medico.nome = nome || medico.nome;
      medico.especialidades = especialidades || medico.especialidades;
      medico.conveniosAceitos = conveniosAceitos || medico.conveniosAceitos;
      medico.biografia = biografia || medico.biografia;
      medico.telefone = telefone || medico.telefone;
      medico.email = email || medico.email;

      await medico.save();

      res.json({
        success: true,
        message: 'Médico atualizado com sucesso',
        data: medico
      });

    } catch (error) {
      console.error('Erro ao atualizar médico:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Remover médico
  async remover(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.user._id;

      // Buscar estabelecimento do usuário
      const estabelecimento = await Estabelecimento.findOne({ admin: userId });
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Buscar médico
      const medico = await Medico.findOne({ 
        _id: id,
        estabelecimento: estabelecimento._id 
      });

      if (!medico) {
        return res.status(404).json({ 
          error: 'Médico não encontrado' 
        });
      }

      // Desativar em vez de remover
      medico.ativo = false;
      await medico.save();

      // Remover do array de médicos do estabelecimento
      estabelecimento.medicos = estabelecimento.medicos.filter(
        medicoId => medicoId.toString() !== id
      );
      await estabelecimento.save();

      res.json({
        success: true,
        message: 'Médico removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover médico:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  }
};

module.exports = medicoController;


