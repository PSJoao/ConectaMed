const {
  findUsuarioById,
  findEstabelecimentoById,
  addFavorito,
  removeFavorito,
  listarFavoritos,
  isFavorito,
} = require('../models/db');

const favoritoController = {
  // Adicionar estabelecimento aos favoritos
  async adicionarFavorito(req, res) {
    try {
      const { estabelecimentoId } = req.params;
      const userId = req.session.user._id;

      // Verificar se o estabelecimento existe
      const estabelecimento = await findEstabelecimentoById(estabelecimentoId);
      if (!estabelecimento) {
        return res.status(404).json({
          error: 'Estabelecimento não encontrado'
        });
      }

      // Buscar usuário e adicionar favorito
      const usuario = await findUsuarioById(userId);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      await addFavorito(userId, estabelecimentoId);

      res.json({
        success: true,
        message: 'Estabelecimento adicionado aos favoritos'
      });

    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  },

  // Remover estabelecimento dos favoritos
  async removerFavorito(req, res) {
    try {
      const { estabelecimentoId } = req.params;
      const userId = req.session.user._id;

      const usuario = await findUsuarioById(userId);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      await removeFavorito(userId, estabelecimentoId);

      res.json({
        success: true,
        message: 'Estabelecimento removido dos favoritos'
      });

    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  },

  // Listar favoritos do usuário
  async listarFavoritos(req, res) {
    try {
      const userId = req.session.user._id;

      const usuario = await findUsuarioById(userId);

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      const favoritos = await listarFavoritos(userId);

      res.json({
        success: true,
        data: favoritos,
        total: favoritos.length
      });

    } catch (error) {
      console.error('Erro ao listar favoritos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  },

  // Verificar se estabelecimento é favorito
  async verificarFavorito(req, res) {
    try {
      const { estabelecimentoId } = req.params;
      const userId = req.session.user._id;

      const usuario = await findUsuarioById(userId);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      const ehFavorito = await isFavorito(userId, estabelecimentoId);

      res.json({
        success: true,
        data: { ehFavorito }
      });

    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      res.status(500).json({
        error: 'Erro interno do servidor'
      });
    }
  }
};

module.exports = favoritoController;
