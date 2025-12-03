const bcrypt = require('bcryptjs');
const {
  findUsuarioByEmail,
  createUsuario,
  updateUsuarioLoginInfo,
  createEstabelecimento,
  setUsuarioEstabelecimento,
} = require('../models/db');

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
      const usuario = await findUsuarioByEmail(email);
      
      if (!usuario) {
        return res.status(401).json({ 
          error: 'Credenciais inválidas' 
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      
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
      await updateUsuarioLoginInfo(usuario.id);

      // Criar sessão
      req.session.user = {
        _id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        estabelecimento: usuario.estabelecimentoId
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
      const usuarioExistente = await findUsuarioByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ 
          error: 'Email já cadastrado' 
        });
      }

      // Criar usuário
      const usuario = await createUsuario({ nome, email, senha, tipo });

      // Criar estabelecimento
      const estabelecimento = await createEstabelecimento({
        nome,
        cnpj: cnpj || null,
        tipo,
        enderecoCompleto: enderecoCompleto || '',
        telefone: telefone || '',
        horarioFuncionamento: horarioFuncionamento || '',
        descricao: null,
        site: null,
        conveniosGerais: [],
        latitude: null,
        longitude: null,
        adminId: usuario.id,
      });

      // Atualizar usuário com referência ao estabelecimento
      await setUsuarioEstabelecimento(usuario.id, estabelecimento.id);

      // Criar sessão
      req.session.user = {
        _id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        estabelecimento: estabelecimento.id
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


