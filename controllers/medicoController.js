const {
  searchMedicos,
  findMedicoById,
  createMedico,
  findMedicoByCrm,
  updateMedico,
  softDeleteMedico,
  findEstabelecimentoByAdmin,
} = require('../models/db');

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

      const medicos = await searchMedicos({
        search: search || null,
        especialidade: especialidade || null,
        convenio: convenio || null,
        estabelecimentoId: estabelecimento || null,
      });

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
      const medico = await findMedicoById(req.params.id);

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
      const estabelecimento = await findEstabelecimentoByAdmin(userId);
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Verificar se CRM já existe
      const medicoExistente = await findMedicoByCrm(crm);
      if (medicoExistente) {
        return res.status(400).json({ 
          error: 'CRM já cadastrado' 
        });
      }

      // Criar médico
      const medico = await createMedico(estabelecimento.id, {
        nome,
        crm,
        especialidades: especialidades || [],
        conveniosAceitos: conveniosAceitos || [],
        biografia: biografia || '',
        telefone: telefone || '',
        email: email || '',
      });

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
      const estabelecimento = await findEstabelecimentoByAdmin(userId);
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Buscar médico e garantir que pertence ao estabelecimento do admin
      const medico = await updateMedico(estabelecimento.id, id, {
        nome,
        especialidades,
        conveniosAceitos,
        biografia,
        telefone,
        email,
      });

      if (!medico) {
        return res.status(404).json({ 
          error: 'Médico não encontrado' 
        });
      }

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
      const estabelecimento = await findEstabelecimentoByAdmin(userId);
      
      if (!estabelecimento) {
        return res.status(404).json({ 
          error: 'Estabelecimento não encontrado' 
        });
      }

      // Desativar em vez de remover
      const existing = await softDeleteMedico(estabelecimento.id, id);

      if (!existing) {
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


