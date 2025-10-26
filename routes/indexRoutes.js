const express = require('express');
const router = express.Router();

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
};

// Página inicial
router.get('/', async (req, res) => {
  try {
    const Estabelecimento = require('../models/Estabelecimento');
    
    // Buscar estabelecimentos para exibir no mapa
    const estabelecimentos = await Estabelecimento.find({ ativo: true })
      .select('nome enderecoCompleto localizacao telefone tipo')
      .limit(100); // Limitar para performance

    res.render('home_modern', {
      title: 'ConectaMed - Encontre serviços de saúde próximos',
      estabelecimentos: JSON.stringify(estabelecimentos)
    });
  } catch (error) {
    console.error('Erro ao carregar página inicial:', error);
    res.render('home_simple', {
      title: 'ConectaMed - Encontre serviços de saúde próximos',
      estabelecimentos: []
    });
  }
});

// Página de login
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  
  res.render('login', {
    title: 'Login - ConectaMed',
    error: req.query.error || null
  });
});

// Página de cadastro
router.get('/cadastro', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  
  res.render('cadastro', {
    title: 'Cadastro - ConectaMed',
    error: req.query.error || null
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    }
    res.redirect('/');
  });
});

// Página sobre
router.get('/sobre', (req, res) => {
  res.render('sobre', {
    title: 'Sobre o ConectaMed'
  });
});

// Página de contato
router.get('/contato', (req, res) => {
  res.render('contato', {
    title: 'Contato - ConectaMed'
  });
});

module.exports = router;


