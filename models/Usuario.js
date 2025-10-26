const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo de usuário é obrigatório'],
    enum: {
      values: ['usuario', 'clinica', 'orgao_publico'],
      message: 'Tipo deve ser "usuario", "clinica" ou "orgao_publico"'
    }
  },
  estabelecimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estabelecimento',
    default: null
  },
  favoritos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estabelecimento'
  }],
  configuracoes: {
    notificacoes: {
      type: Boolean,
      default: true
    },
    tema: {
      type: String,
      enum: ['claro', 'escuro', 'auto'],
      default: 'auto'
    },
    idioma: {
      type: String,
      default: 'pt-BR'
    }
  },
  ativo: {
    type: Boolean,
    default: true
  },
  ultimoLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Middleware para criptografar senha antes de salvar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
usuarioSchema.methods.compararSenha = async function(senhaCandidata) {
  return await bcrypt.compare(senhaCandidata, this.senha);
};

// Método para obter dados públicos do usuário
usuarioSchema.methods.toJSON = function() {
  const usuario = this.toObject();
  delete usuario.senha;
  return usuario;
};

// Método para adicionar favorito
usuarioSchema.methods.adicionarFavorito = async function(estabelecimentoId) {
  if (!this.favoritos.includes(estabelecimentoId)) {
    this.favoritos.push(estabelecimentoId);
    await this.save();
  }
  return this;
};

// Método para remover favorito
usuarioSchema.methods.removerFavorito = async function(estabelecimentoId) {
  this.favoritos = this.favoritos.filter(id => !id.equals(estabelecimentoId));
  await this.save();
  return this;
};

// Método para verificar se é favorito
usuarioSchema.methods.ehFavorito = function(estabelecimentoId) {
  return this.favoritos.some(id => id.equals(estabelecimentoId));
};

// Índices para performance
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ tipo: 1 });
usuarioSchema.index({ ativo: 1 });

module.exports = mongoose.model('Usuario', usuarioSchema);


