const Usuario = require('../models/Usuario');
const Estabelecimento = require('../models/Estabelecimento');
const googleMapsService = require('../services/GoogleMapsService');

const authController = {
  // Login
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ 
          error: 'Email e senha são obrigatórios' 
        });
      }

      // Buscar usuário
      const usuario = await Usuario.findOne({ email }).select('+senha');
      
      if (!usuario) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        });
      }

      // Verificar senha
      const senhaValida = await usuario.compararSenha(senha);
      
      if (!senhaValida) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        });
      }

      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        return res.status(401).json({ 
          error: 'Conta desativada' 
        });
      }

      // Atualizar último login
      usuario.ultimoLogin = new Date();
      await usuario.save();

      // Criar sessão
      req.session.user = {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        estabelecimento: usuario.estabelecimento
      };

      res.json({ 
        success: true, 
        message: 'Login realizado com sucesso',
        user: req.session.user
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Registro
  async register(req, res) {
    try {
      const { nome, email, senha, tipo, enderecoCompleto, telefone, horarioFuncionamento, cnpj } = req.body;

      // Validações básicas
      if (!nome || !email || !senha || !tipo) {
        return res.status(400).json({ 
          error: 'Todos os campos obrigatórios devem ser preenchidos' 
        });
      }

      if (!['clinica', 'orgao_publico'].includes(tipo)) {
        return res.status(400).json({ 
          error: 'Tipo de usuário inválido' 
        });
      }

      // Verificar se email já existe
      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        return res.status(400).json({ 
          error: 'Email já cadastrado' 
        });
      }

      // Geocodificar endereço
      let coordenadas = null;
      if (enderecoCompleto) {
        try {
          const geocoding = await googleMapsService.geocodificar(enderecoCompleto);
          if (geocoding && geocoding.results && geocoding.results.length > 0) {
            const location = geocoding.results[0].geometry.location;
            coordenadas = [location.lng, location.lat];
          }
        } catch (geoError) {
          console.error('Erro na geocodificação:', geoError);
          // Continuar mesmo se a geocodificação falhar
        }
      }

      // Criar usuário
      const usuario = new Usuario({
        nome,
        email,
        senha,
        tipo
      });

      await usuario.save();

      // Criar estabelecimento
      const estabelecimento = new Estabelecimento({
        nome,
        cnpj: cnpj || null,
        tipo,
        enderecoCompleto: enderecoCompleto || '',
        telefone: telefone || '',
        horarioFuncionamento: horarioFuncionamento || '',
        localizacao: coordenadas ? {
          type: 'Point',
          coordinates: coordenadas
        } : null,
        admin: usuario._id,
        ativo: true
      });

      await estabelecimento.save();

      // Atualizar usuário com referência ao estabelecimento
      usuario.estabelecimento = estabelecimento._id;
      await usuario.save();

      // Criar sessão
      req.session.user = {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        estabelecimento: estabelecimento._id
      };

      res.status(201).json({ 
        success: true, 
        message: 'Cadastro realizado com sucesso',
        user: req.session.user
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          error: 'Email já cadastrado' 
        });
      }

      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  },

  // Logout
  async logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Erro no logout:', err);
          return res.status(500).json({ 
            error: 'Erro ao fazer logout' 
          });
        }
        
        res.json({ 
          success: true, 
          message: 'Logout realizado com sucesso' 
        });
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor' 
      });
    }
  }
};

module.exports = authController;


