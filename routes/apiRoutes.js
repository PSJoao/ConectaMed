const express = require('express');
const router = express.Router();

// Importar controllers
const authController = require('../controllers/authController');
const estabelecimentoController = require('../controllers/estabelecimentoController');
const medicoController = require('../controllers/medicoController');
const favoritoController = require('../controllers/favoritoController');

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Não autorizado' });
};

// Rotas de autenticação
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authController.logout);

// Rotas de estabelecimentos (públicas)
router.get('/estabelecimentos', estabelecimentoController.buscarEstabelecimentos);
router.get('/estabelecimentos/:id', estabelecimentoController.buscarPorId);
router.get('/estabelecimentos/proximos/:lat/:lng', estabelecimentoController.buscarProximos);

// Rotas de médicos (públicas)
router.get('/medicos', medicoController.buscarMedicos);
router.get('/medicos/:id', medicoController.buscarPorId);

// Rotas administrativas (protegidas)
router.post('/admin/estabelecimento', requireAuth, estabelecimentoController.criarOuAtualizar);
router.delete('/admin/estabelecimento', requireAuth, estabelecimentoController.remover);

router.post('/admin/medicos', requireAuth, medicoController.criar);
router.put('/admin/medicos/:id', requireAuth, medicoController.atualizar);
router.delete('/admin/medicos/:id', requireAuth, medicoController.remover);

// Rotas de filtros dinâmicos
router.get('/filtros/especialidades', estabelecimentoController.obterEspecialidades);
router.get('/filtros/convenios', estabelecimentoController.obterConvenios);
router.get('/filtros/tipos', estabelecimentoController.obterTipos);

// Rota de avaliação
router.post('/estabelecimentos/:id/avaliar', estabelecimentoController.avaliar);

// Rotas de favoritos (protegidas)
router.post('/favoritos/:estabelecimentoId', requireAuth, favoritoController.adicionarFavorito);
router.delete('/favoritos/:estabelecimentoId', requireAuth, favoritoController.removerFavorito);
router.get('/favoritos', requireAuth, favoritoController.listarFavoritos);
router.get('/favoritos/:estabelecimentoId', requireAuth, favoritoController.verificarFavorito);

// Rota de upload de fotos
router.post('/upload', requireAuth, estabelecimentoController.uploadFotos);

module.exports = router;


