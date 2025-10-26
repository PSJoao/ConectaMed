const express = require('express');
const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.tipo) {
    return next();
  }
  res.redirect('/login');
};

// Dashboard principal
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const Estabelecimento = require('../models/Estabelecimento');
    const Medico = require('../models/Medico');
    
    // Buscar estabelecimento do usuário
    const estabelecimento = await Estabelecimento.findOne({ 
      admin: req.session.user._id 
    }).populate('medicos');

    // Estatísticas básicas
    const totalMedicos = await Medico.countDocuments({ 
      estabelecimento: estabelecimento?._id 
    });

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

// Gerenciar estabelecimento
router.get('/estabelecimento', requireAuth, async (req, res) => {
  try {
    const Estabelecimento = require('../models/Estabelecimento');
    
    const estabelecimento = await Estabelecimento.findOne({ 
      admin: req.session.user._id 
    });

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

// Gerenciar médicos
router.get('/medicos', requireAuth, async (req, res) => {
  try {
    const Estabelecimento = require('../models/Estabelecimento');
    const Medico = require('../models/Medico');
    
    const estabelecimento = await Estabelecimento.findOne({ 
      admin: req.session.user._id 
    });

    if (!estabelecimento) {
      return res.render('error', {
        title: 'Erro',
        message: 'Estabelecimento não encontrado'
      });
    }

    const medicos = await Medico.find({ 
      estabelecimento: estabelecimento._id 
    }).sort({ nome: 1 });

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

// Adicionar médico
router.get('/medicos/novo', requireAuth, (req, res) => {
  res.render('admin/medico_form', {
    title: 'Adicionar Médico',
    medico: null,
    user: req.session.user
  });
});

// Editar médico
router.get('/medicos/:id/editar', requireAuth, async (req, res) => {
  try {
    const Medico = require('../models/Medico');
    const Estabelecimento = require('../models/Estabelecimento');
    
    const estabelecimento = await Estabelecimento.findOne({ 
      admin: req.session.user._id 
    });

    if (!estabelecimento) {
      return res.render('error', {
        title: 'Erro',
        message: 'Estabelecimento não encontrado'
      });
    }

    const medico = await Medico.findOne({ 
      _id: req.params.id,
      estabelecimento: estabelecimento._id 
    });

    if (!medico) {
      return res.render('error', {
        title: 'Erro',
        message: 'Médico não encontrado'
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
    const Estabelecimento = require('../models/Estabelecimento');
    
    const estabelecimento = await Estabelecimento.findOne({ 
      admin: req.session.user._id 
    });

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


