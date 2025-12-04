const express = require('express');
const router = express.Router();
const { searchEstabelecimentos } = require('../models/db');

// --- MIDDLEWARE GLOBAL DE USUÁRIO ---
// Isso garante que a variável {{user}} esteja disponível em todos os arquivos .hbs
router.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  // Admin se for tipo 'admin' OU se for o email específico
  res.locals.isAdmin = req.session.user && (req.session.user.tipo === 'admin' || req.session.user.email === 'admin@conectamed.com');
  next();
});

// Página inicial
router.get('/', async (req, res) => {
  try {
    // A função searchEstabelecimentos já filtra por "ativo = TRUE" e limita os resultados
    // Não precisamos mais de .find(), .select() ou .limit() do Mongoose
    const estabelecimentos = await searchEstabelecimentos({});

    res.render('home_modern', {
      title: 'ConectaMed - Encontre serviços de saúde próximos',
      // Passamos os dados como string JSON para o script do mapa no frontend
      estabelecimentos: JSON.stringify(estabelecimentos)
    });
  } catch (error) {
    console.error('Erro ao carregar página inicial:', error);
    res.render('home_simple', {
      title: 'ConectaMed - Encontre serviços de saúde próximos',
      estabelecimentos: [] // Array vazio em caso de erro para não quebrar a página
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

// Área do Parceiro (Login/Cadastro Específico)
router.get('/sou-parceiro', (req, res) => {
  if (req.session.user) {
    // Se já estiver logado, redireciona conforme o tipo
    if (req.session.user.tipo === 'usuario') return res.redirect('/');
    return res.redirect('/admin/dashboard');
  }
  
  res.render('parceiro_login', {
    title: 'Área do Parceiro - ConectaMed',
    layout: 'main' // Usa o layout padrão, mas a view será diferente
  });
});

module.exports = router;