-- Esquema principal do PostgreSQL para o ConectaMed
-- Banco esperado: conectamed
-- Usuário padrão: postgres / senha: postdba

-- IMPORTANTE:
-- 1) Crie o banco (se ainda não existir):
--    CREATE DATABASE conectamed;
--
-- 2) Conecte nele:
--    \c conectamed;
--
-- 3) Rode este arquivo (pelo psql ou pgAdmin).

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('usuario','clinica','orgao_publico')),
  estabelecimento_id INTEGER,
  configuracoes JSONB,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de estabelecimentos
CREATE TABLE IF NOT EXISTS estabelecimentos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('clinica','orgao_publico')),
  endereco_completo TEXT NOT NULL,
  telefone TEXT NOT NULL,
  horario_funcionamento TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  fotos TEXT[] NOT NULL DEFAULT '{}',
  convenios_gerais TEXT[] NOT NULL DEFAULT '{}',
  admin_id INTEGER NOT NULL REFERENCES usuarios(id),
  descricao TEXT,
  site TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de médicos
CREATE TABLE IF NOT EXISTS medicos (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  crm TEXT NOT NULL UNIQUE,
  especialidades TEXT[] NOT NULL DEFAULT '{}',
  convenios_aceitos TEXT[] NOT NULL DEFAULT '{}',
  biografia TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de avaliações de estabelecimentos
CREATE TABLE IF NOT EXISTS avaliacoes (
  id SERIAL PRIMARY KEY,
  estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id),
  usuario_nome TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de favoritos (relação N:N entre usuários e estabelecimentos)
CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  estabelecimento_id INTEGER NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, estabelecimento_id)
);


