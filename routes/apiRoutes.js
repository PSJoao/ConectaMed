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
router.post('/auth/register-partner', authController.registerPartner);

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

router.post('/admin/estabelecimentos', async (req, res) => {
    try {
        // Se não houver usuário na sessão, use o ID 1 (Admin do Seed) como fallback ou erro
        const adminId = req.session.user ? req.session.user._id : 1; 
        
        const { nome, tipo, enderecoCompleto, telefone, latitude, longitude, conveniosGerais } = req.body;
        
        // Função auxiliar no db.js (precisa exportar createEstabelecimento)
        const { createEstabelecimento } = require('../models/db');
        
        const novoEst = await createEstabelecimento({
            nome, tipo, enderecoCompleto, telefone,
            latitude: Number(latitude),
            longitude: Number(longitude),
            conveniosGerais,
            adminId,
            horarioFuncionamento: '08:00 - 18:00', // Padrão
            descricao: 'Cadastrado via Painel Admin'
        });
        
        res.json({ success: true, data: novoEst });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erro ao criar estabelecimento' });
    }
});

// Criar Médico (com vínculo N:N)
router.post('/admin/medicos', async (req, res) => {
    try {
        const { nome, crm, especialidades, conveniosAceitos, estabelecimentoIds } = req.body;
        const { createMedico, pool } = require('../models/db'); // Importe pool para query manual se necessario
        
        // Como o createMedico original aceitava apenas 1 ID, vamos adaptar ou chamar direto
        // O createMedico que fiz anteriormente já trata a inserção na tabela N:N para o primeiro ID
        // Vamos usar o primeiro ID para criar e depois inserir os outros
        
        const mainEstId = estabelecimentoIds[0];
        
        // 1. Cria o médico e vincula ao primeiro
        const medico = await createMedico(mainEstId, {
            nome, crm, especialidades, conveniosAceitos
        });
        
        // 2. Se houver mais estabelecimentos, vincula os extras
        if (estabelecimentoIds.length > 1) {
            const extras = estabelecimentoIds.slice(1);
            for (const estId of extras) {
                await require('../config/db').pool.query(
                    `INSERT INTO medicos_estabelecimentos (medico_id, estabelecimento_id) 
                     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [medico.id, estId]
                );
            }
        }
        
        res.json({ success: true, data: medico });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Erro ao criar médico' });
    }
});

module.exports = router;


