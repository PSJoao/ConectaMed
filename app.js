const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/db');

// Segredo de sessão com fallback seguro em desenvolvimento
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret_change_me';

// Importar rotas
const indexRoutes = require('./routes/indexRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

const app = express();

// Conectar ao banco de dados
connectDB();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com", "https://unpkg.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "https://*.tile.openstreetmap.org"],
      frameSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // AUMENTADO de 100 para 10000 para facilitar o desenvolvimento
  message: 'Muitas tentativas. Tente novamente em 15 minutos.'
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Configuração do Handlebars
const hbs = exphbs.create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    // Comparação
    eq: function(a, b) { return a === b; },
    ne: function(a, b) { return a !== b; },
    gt: function(a, b) { return a > b; },
    lt: function(a, b) { return a < b; },
    gte: function(a, b) { return a >= b; },
    lte: function(a, b) { return a <= b; },
    
    // Lógica
    and: function(a, b) { return a && b; },
    or: function(a, b) { return a || b; },
    not: function(a) { return !a; },
    
    // Matemática
    add: function(a, b) { return a + b; },
    subtract: function(a, b) { return a - b; },
    multiply: function(a, b) { return a * b; },
    divide: function(a, b) { return b !== 0 ? a / b : 0; },
    
    // Loops
    times: function(n, options) {
      let result = '';
      for (let i = 0; i < n; i++) {
        result += options.fn(i);
      }
      return result;
    },
    
    // String
    uppercase: function(str) { return str ? str.toString().toUpperCase() : ''; },
    lowercase: function(str) { return str ? str.toString().toLowerCase() : ''; },
    capitalize: function(str) { 
      return str ? str.toString().charAt(0).toUpperCase() + str.toString().slice(1).toLowerCase() : '';
    },
    
    // Data
    formatDate: function(date) {
      return new Date(date).toLocaleDateString('pt-BR');
    },
    formatDateTime: function(date) {
      return new Date(date).toLocaleString('pt-BR');
    },
    
    // Telefone
    formatPhone: function(phone) {
      return phone ? phone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3') : '';
    },
    
    // Array
    length: function(arr) { return arr ? arr.length : 0; },
    first: function(arr) { return arr && arr.length > 0 ? arr[0] : null; },
    last: function(arr) { return arr && arr.length > 0 ? arr[arr.length - 1] : null; },
    
    // JSON
    json: function(context) {
      return JSON.stringify(context);
    },
    
    // Condicionais
    if_eq: function(a, b, options) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    
    if_gt: function(a, b, options) {
      if (a > b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    
    if_lt: function(a, b, options) {
      if (a < b) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  }
});

app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para disponibilizar dados globais nas views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  next();
});

// Rotas
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Rota para perfil de estabelecimento
app.get('/local/:id', async (req, res) => {
  try {
    const { getEstabelecimentoDetalhado } = require('./models/db');
    const estabelecimento = await getEstabelecimentoDetalhado(req.params.id);

    if (!estabelecimento) {
      return res.status(404).render('404', {
        title: 'Estabelecimento não encontrado',
        message: 'O estabelecimento solicitado não foi encontrado.'
      });
    }

    res.render('perfil_estabelecimento', {
      title: estabelecimento.nome,
      estabelecimento
    });
  } catch (error) {
    console.error('Erro ao carregar estabelecimento:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Erro interno do servidor'
    });
  }
});

// Rota 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página não encontrada',
    message: 'A página que você está procurando não existe.'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Erro interno',
    message: process.env.NODE_ENV === 'production' 
      ? 'Algo deu errado. Tente novamente mais tarde.' 
      : err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});


