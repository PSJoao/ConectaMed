const mongoose = require('mongoose');

const medicoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do médico é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  crm: {
    type: String,
    required: [true, 'CRM é obrigatório'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^\d+$/, 'CRM deve conter apenas números']
  },
  especialidades: [{
    type: String,
    required: [true, 'Especialidade é obrigatória'],
    trim: true,
    maxlength: [50, 'Especialidade não pode ter mais de 50 caracteres']
  }],
  conveniosAceitos: [{
    type: String,
    trim: true,
    maxlength: [50, 'Convênio não pode ter mais de 50 caracteres']
  }],
  biografia: {
    type: String,
    trim: true,
    maxlength: [1000, 'Biografia não pode ter mais de 1000 caracteres']
  },
  telefone: {
    type: String,
    trim: true,
    match: [/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  ativo: {
    type: Boolean,
    default: true
  },
  estabelecimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estabelecimento',
    required: [true, 'Estabelecimento é obrigatório']
  }
}, {
  timestamps: true
});

// Índices para performance e busca
medicoSchema.index({ crm: 1 });
medicoSchema.index({ especialidades: 1 });
medicoSchema.index({ conveniosAceitos: 1 });
medicoSchema.index({ estabelecimento: 1 });
medicoSchema.index({ ativo: 1 });

// Índice de texto para busca
medicoSchema.index({
  nome: 'text',
  especialidades: 'text',
  biografia: 'text'
});

module.exports = mongoose.model('Medico', medicoSchema);


