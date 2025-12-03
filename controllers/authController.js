const bcrypt = require('bcryptjs');
const {
  findUsuarioByEmail,
  createUsuario,
  updateUsuarioLoginInfo,
  createEstabelecimento,
  setUsuarioEstabelecimento,
} = require('../models/db');

const authController = {
  // Login (Unificado para todos)
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const usuario = await findUsuarioByEmail(email);
      
      if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      if (!usuario.ativo) {
        return res.status(401).json({ error: 'Conta desativada' });
      }

      await updateUsuarioLoginInfo(usuario.id);

      req.session.user = {
        _id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        estabelecimento: usuario.estabelecimentoId // Será null para pacientes
      };

      res.json({ 
        success: true, 
        message: 'Login realizado com sucesso',
        user: req.session.user,
        redirect: usuario.tipo === 'usuario' ? '/' : '/admin/dashboard'
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Registro Público (Apenas Pacientes)
  async register(req, res) {
    try {
      const { nome, email, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos' });
      }

      if (await findUsuarioByEmail(email)) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Cria usuário tipo 'usuario' (paciente)
      const usuario = await createUsuario({ nome, email, senha, tipo: 'usuario' });

      req.session.user = {
        _id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      };

      res.status(201).json({ 
        success: true, 
        message: 'Cadastro realizado com sucesso',
        redirect: '/'
      });

    } catch (error) {
      console.error('Erro no registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Registro de Parceiro (Área restrita /sou-parceiro)
  async registerPartner(req, res) {
    try {
      const { 
        nome, email, senha, tipo, 
        nomeEstabelecimento, cnpj, enderecoCompleto, telefone 
      } = req.body;

      if (!['clinica', 'orgao_publico'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de estabelecimento inválido' });
      }

      if (await findUsuarioByEmail(email)) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // 1. Cria o Admin do Estabelecimento
      const usuario = await createUsuario({ nome, email, senha, tipo });

      // 2. Cria o Estabelecimento vinculado
      const estabelecimento = await createEstabelecimento({
        nome: nomeEstabelecimento,
        cnpj: cnpj || null,
        tipo,
        enderecoCompleto: enderecoCompleto || '',
        telefone: telefone || '',
        horarioFuncionamento: 'A definir',
        descricao: null,
        site: null,
        conveniosGerais: [],
        latitude: null,
        longitude: null,
        adminId: usuario.id,
      });

      // 3. Vincula usuário ao estabelecimento
      await setUsuarioEstabelecimento(usuario.id, estabelecimento.id);

      req.session.user = {
        _id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        estabelecimento: estabelecimento.id
      };

      res.status(201).json({ 
        success: true, 
        message: 'Parceiro registrado com sucesso',
        redirect: '/admin/dashboard'
      });

    } catch (error) {
      console.error('Erro no registro de parceiro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  // Logout
  async logout(req, res) {
    req.session.destroy(() => {
      res.json({ success: true, redirect: '/' });
    });
  }
};

module.exports = authController;