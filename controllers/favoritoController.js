const Usuario = require('../models/Usuario');
const Estabelecimento = require('../models/Estabelecimento');

const favoritoController = {
  // Adicionar estabelecimento aos favoritos
  async adicionarFavorito(req, res) {
    try {
      const { estabelecimentoId } = req.params;
      const userId = req.session.user._id;

      // Verificar se o estabelecimento existe
      const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
      if (!estabelecimento) {
        return res.status(404).json({
          error: 'Estabelecimento não encontrado'
        });
      }

      // Buscar usuário e adicionar favorito
      const usuario = await Usuario.findById(userId);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      await usuario.adicionarFavorito(estabelecimentoId);

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

      const usuario = await Usuario.findById(userId);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      await usuario.removerFavorito(estabelecimentoId);

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

      const usuario = await Usuario.findById(userId)
        .populate({
          path: 'favoritos',
          populate: {
            path: 'medicos',
            select: 'nome especialidades conveniosAceitos'
          }
        });

      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario.favoritos,
        total: usuario.favoritos.length
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

      const usuario = await Usuario.findById(userId);
      if (!usuario) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      const ehFavorito = usuario.ehFavorito(estabelecimentoId);

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
