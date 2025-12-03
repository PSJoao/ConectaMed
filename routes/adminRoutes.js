const express = require('express');
const router = express.Router();
// Importamos as funções do PostgreSQL em vez dos Models antigos
const { 
  findEstabelecimentoByAdmin, 
  searchMedicos, 
  findMedicoById,
  getDistinctConvenios,
  getDistinctEspecialidades
} = require('../models/db');

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Dashboard principal
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Busca o estabelecimento gerenciado pelo usuário logado
    const estabelecimento = await findEstabelecimentoByAdmin(req.session.user._id);
    let totalMedicos = 0;
    
    // Se tiver estabelecimento, busca os médicos para contar e exibir
    if (estabelecimento) {
      const medicos = await searchMedicos({ estabelecimentoId: estabelecimento.id });
      totalMedicos = medicos.length;
      // Anexa os médicos ao objeto para caso a view precise listar
      estabelecimento.medicos = medicos;
    }

    res.render('dashboard', {
      title: 'Dashboard - ConectaMed',
      estabelecimento,
      totalMedicos,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.render('error', {
      title: 'Erro',
      message: 'Erro ao carregar dashboard'
    });
  }
});

// Gerenciar estabelecimento (Dados da Clínica/Órgão)
router.get('/estabelecimento', requireAuth, async (req, res) => {
  try {
    const estabelecimento = await findEstabelecimentoByAdmin(req.session.user._id);

    res.render('admin/estabelecimento', {
      title: 'Gerenciar Estabelecimento',
      estabelecimento,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar página do estabelecimento:', error);
    res.render('error', {
      title: 'Erro',
      message: 'Erro ao carregar dados do estabelecimento'
    });
  }
});

// Gerenciar médicos (Listagem)
router.get('/medicos', requireAuth, async (req, res) => {
  try {
    const estabelecimento = await findEstabelecimentoByAdmin(req.session.user._id);

    if (!estabelecimento) {
      return res.render('error', {
        title: 'Erro',
        message: 'Estabelecimento não encontrado. Complete seu cadastro primeiro.'
      });
    }

    // Busca médicos vinculados a este estabelecimento
    const medicos = await searchMedicos({ estabelecimentoId: estabelecimento.id });

    res.render('admin/medicos', {
      title: 'Gerenciar Médicos',
      medicos,
      estabelecimento,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar médicos:', error);
    res.render('error', {
      title: 'Erro',
      message: 'Erro ao carregar lista de médicos'
    });
  }
});

// Formulário para Adicionar Médico
router.get('/medicos/novo', requireAuth, (req, res) => {
  res.render('admin/medico_form', {
    title: 'Adicionar Médico',
    medico: null,
    user: req.session.user
  });
});

// Formulário para Editar Médico
router.get('/medicos/:id/editar', requireAuth, async (req, res) => {
  try {
    const estabelecimento = await findEstabelecimentoByAdmin(req.session.user._id);

    if (!estabelecimento) {
      return res.redirect('/admin/dashboard');
    }

    // Busca o médico pelo ID
    const medico = await findMedicoById(req.params.id);

    // Segurança: Verifica se o médico existe e pertence ao estabelecimento do admin
    // Nota: Como os IDs podem vir como números ou strings, usamos == ou conversão para comparar
    if (!medico || String(medico.estabelecimentoId) !== String(estabelecimento.id)) {
      return res.render('error', {
        title: 'Acesso Negado',
        message: 'Você não tem permissão para editar este médico ou ele não existe.'
      });
    }

    res.render('admin/medico_form', {
      title: 'Editar Médico',
      medico,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar médico:', error);
    res.render('error', {
      title: 'Erro',
      message: 'Erro ao carregar dados do médico'
    });
  }
});

// Gerenciar convênios
router.get('/convenios', requireAuth, async (req, res) => {
  try {
    const estabelecimento = await findEstabelecimentoByAdmin(req.session.user._id);

    res.render('admin/convenios', {
      title: 'Gerenciar Convênios',
      estabelecimento,
      user: req.session.user
    });
  } catch (error) {
    console.error('Erro ao carregar convênios:', error);
    res.render('error', {
      title: 'Erro',
      message: 'Erro ao carregar convênios'
    });
  }
});

// Configurações da conta
router.get('/configuracoes', requireAuth, (req, res) => {
  res.render('admin/configuracoes', {
    title: 'Configurações da Conta',
    user: req.session.user
  });
});

module.exports = router;