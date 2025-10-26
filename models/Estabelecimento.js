const mongoose = require('mongoose');

const estabelecimentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome do estabelecimento é obrigatório'],
    trim: true,
    maxlength: [200, 'Nome não pode ter mais de 200 caracteres']
  },
  cnpj: {
    type: String,
    trim: true,
    match: [/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido']
  },
  tipo: {
    type: String,
    required: [true, 'Tipo de estabelecimento é obrigatório'],
    enum: {
      values: ['clinica', 'orgao_publico'],
      message: 'Tipo deve ser "clinica" ou "orgao_publico"'
    }
  },
  enderecoCompleto: {
    type: String,
    required: [true, 'Endereço é obrigatório'],
    trim: true,
    maxlength: [500, 'Endereço não pode ter mais de 500 caracteres']
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true,
    match: [/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido']
  },
  horarioFuncionamento: {
    type: String,
    required: [true, 'Horário de funcionamento é obrigatório'],
    trim: true,
    maxlength: [200, 'Horário não pode ter mais de 200 caracteres']
  },
  localizacao: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Coordenadas são obrigatórias'],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && 
                 coords[1] >= -90 && coords[1] <= 90;
        },
        message: 'Coordenadas inválidas'
      }
    }
  },
  fotos: [{
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'URL de foto inválida']
  }],
  medicos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medico'
  }],
  conveniosGerais: [{
    type: String,
    trim: true,
    maxlength: [50, 'Convênio não pode ter mais de 50 caracteres']
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Administrador é obrigatório']
  },
  descricao: {
    type: String,
    trim: true,
    maxlength: [1000, 'Descrição não pode ter mais de 1000 caracteres']
  },
  site: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'URL do site inválida']
  },
  ativo: {
    type: Boolean,
    default: true
  },
  avaliacoes: [{
    usuario: {
      type: String,
      required: true,
      trim: true
    },
    nota: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comentario: {
      type: String,
      trim: true,
      maxlength: [500, 'Comentário não pode ter mais de 500 caracteres']
    },
    data: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Índice geoespacial para consultas de proximidade
estabelecimentoSchema.index({ localizacao: '2dsphere' });

// Índices para performance
estabelecimentoSchema.index({ tipo: 1 });
estabelecimentoSchema.index({ ativo: 1 });
estabelecimentoSchema.index({ admin: 1 });
estabelecimentoSchema.index({ conveniosGerais: 1 });

// Índice de texto para busca
estabelecimentoSchema.index({
  nome: 'text',
  enderecoCompleto: 'text',
  descricao: 'text'
});

// Virtual para calcular nota média
estabelecimentoSchema.virtual('notaMedia').get(function() {
  if (this.avaliacoes.length === 0) return 0;
  const soma = this.avaliacoes.reduce((acc, aval) => acc + aval.nota, 0);
  return (soma / this.avaliacoes.length).toFixed(1);
});

// Método para adicionar avaliação
estabelecimentoSchema.methods.adicionarAvaliacao = function(usuario, nota, comentario) {
  this.avaliacoes.push({
    usuario,
    nota,
    comentario,
    data: new Date()
  });
  return this.save();
};

// Método para buscar estabelecimentos próximos
estabelecimentoSchema.statics.buscarProximos = function(longitude, latitude, raioKm = 10) {
  return this.find({
    localizacao: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: raioKm * 1000 // Converter km para metros
      }
    },
    ativo: true
  });
};

module.exports = mongoose.model('Estabelecimento', estabelecimentoSchema);


