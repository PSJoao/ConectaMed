const { Pool } = require('pg');

// Configuração padrão de conexão com PostgreSQL
// Usa DATABASE_URL se existir, senão monta a partir das variáveis PG* ou dos defaults informados.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'conectamed',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postdba',
});

const connectDB = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL conectado com sucesso');
  } catch (error) {
    console.error('Erro ao conectar com PostgreSQL:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
