const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// Utilitário para mapear snake_case -> camelCase de forma simples
const mapRow = (row) => {
  if (!row) return null;
  const mapped = {};
  for (const key of Object.keys(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    mapped[camelKey] = row[key];
  }
  return mapped;
};

// ===== Usuários =====
async function findUsuarioByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
  return mapRow(rows[0]);
}

async function findUsuarioById(id) {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

async function createUsuario({ nome, email, senha, tipo }) {
  const salt = await bcrypt.genSalt(12);
  const senhaHash = await bcrypt.hash(senha, salt);

  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha, tipo)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [nome, email, senhaHash, tipo]
  );
  return mapRow(rows[0]);
}

async function updateUsuarioLoginInfo(id) {
  await pool.query(
    'UPDATE usuarios SET ultimo_login = NOW(), updated_at = NOW() WHERE id = $1',
    [id]
  );
}

async function setUsuarioEstabelecimento(usuarioId, estabelecimentoId) {
  await pool.query(
    'UPDATE usuarios SET estabelecimento_id = $1, updated_at = NOW() WHERE id = $2',
    [estabelecimentoId, usuarioId]
  );
}

// ===== Estabelecimentos =====
async function createEstabelecimento(data) {
  const {
    nome,
    cnpj,
    tipo,
    enderecoCompleto,
    telefone,
    horarioFuncionamento,
    descricao,
    site,
    conveniosGerais = [],
    latitude = null,
    longitude = null,
    adminId,
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO estabelecimentos
      (nome, cnpj, tipo, endereco_completo, telefone, horario_funcionamento,
       descricao, site, convenios_gerais, latitude, longitude, admin_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      nome,
      cnpj,
      tipo,
      enderecoCompleto,
      telefone,
      horarioFuncionamento,
      descricao,
      site,
      conveniosGerais,
      latitude,
      longitude,
      adminId,
    ]
  );
  return mapRow(rows[0]);
}

async function updateEstabelecimentoByAdmin(adminId, data) {
  const {
    nome,
    cnpj,
    enderecoCompleto,
    telefone,
    horarioFuncionamento,
    descricao,
    site,
    conveniosGerais,
    latitude,
    longitude,
  } = data;

  const { rows } = await pool.query(
    `UPDATE estabelecimentos
       SET nome = COALESCE($1, nome),
           cnpj = COALESCE($2, cnpj),
           endereco_completo = COALESCE($3, endereco_completo),
           telefone = COALESCE($4, telefone),
           horario_funcionamento = COALESCE($5, horario_funcionamento),
           descricao = COALESCE($6, descricao),
           site = COALESCE($7, site),
           convenios_gerais = COALESCE($8, convenios_gerais),
           latitude = COALESCE($9, latitude),
           longitude = COALESCE($10, longitude),
           updated_at = NOW()
     WHERE admin_id = $11
     RETURNING *`,
    [
      nome || null,
      cnpj || null,
      enderecoCompleto || null,
      telefone || null,
      horarioFuncionamento || null,
      descricao || null,
      site || null,
      conveniosGerais || null,
      latitude,
      longitude,
      adminId,
    ]
  );
  return mapRow(rows[0]);
}

async function findEstabelecimentoByAdmin(adminId) {
  const { rows } = await pool.query(
    'SELECT * FROM estabelecimentos WHERE admin_id = $1 AND ativo = TRUE LIMIT 1',
    [adminId]
  );
  return mapRow(rows[0]);
}

async function softDeleteEstabelecimentoByAdmin(adminId) {
  await pool.query(
    'UPDATE estabelecimentos SET ativo = FALSE, updated_at = NOW() WHERE admin_id = $1',
    [adminId]
  );
}

async function findEstabelecimentoById(id) {
  const { rows } = await pool.query('SELECT * FROM estabelecimentos WHERE id = $1', [id]);
  return mapRow(rows[0]);
}

async function searchEstabelecimentos({ search, tipos, convenios, latitude, longitude, raioKm }) {
  const params = [];
  const where = ['ativo = TRUE'];

  if (tipos && tipos.length) {
    params.push(tipos);
    where.push(`tipo = ANY($${params.length})`);
  }

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    where.push(
      `(nome ILIKE $${idx} OR endereco_completo ILIKE $${idx} OR descricao ILIKE $${idx})`
    );
  }

  if (convenios && convenios.length) {
    params.push(convenios);
    where.push(`(convenios_gerais && $${params.length})`);
  }

  let query = `SELECT * FROM estabelecimentos`;
  if (where.length) {
    query += ' WHERE ' + where.join(' AND ');
  }

  // Aproximação de proximidade geográfica simples usando bounding box (sem extensão PostGIS)
  if (latitude != null && longitude != null && raioKm != null) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    const raio = Number(raioKm);
    const degLat = raio / 111; // ~111km por grau de latitude
    const degLng = raio / (111 * Math.cos((lat * Math.PI) / 180));
    params.push(lat - degLat, lat + degLat, lng - degLng, lng + degLng);
    const baseIdx = params.length - 3;
    query += where.length ? ' AND ' : ' WHERE ';
    query += `(latitude BETWEEN $${baseIdx} AND $${baseIdx + 1}
               AND longitude BETWEEN $${baseIdx + 2} AND $${baseIdx + 3})`;
  }

  query += ' ORDER BY id LIMIT 50';

  const { rows } = await pool.query(query, params);
  return rows.map(mapRow);
}

async function getEstabelecimentosProximos({ latitude, longitude, raioKm }) {
  return searchEstabelecimentos({ latitude, longitude, raioKm, search: null, tipos: null, convenios: null });
}

async function addAvaliacao(estabelecimentoId, { usuarioNome, nota, comentario }) {
  await pool.query(
    `INSERT INTO avaliacoes (estabelecimento_id, usuario_nome, nota, comentario)
     VALUES ($1,$2,$3,$4)`,
    [estabelecimentoId, usuarioNome, nota, comentario || null]
  );
}

async function getEstabelecimentoDetalhado(id) {
  const { rows } = await pool.query(
    `SELECT e.*,
            COALESCE(json_agg(
              json_build_object(
                'id', m.id,
                'nome', m.nome,
                'crm', m.crm,
                'especialidades', m.especialidades,
                'conveniosAceitos', m.convenios_aceitos,
                'biografia', m.biografia,
                'telefone', m.telefone,
                'email', m.email,
                'ativo', m.ativo
              )
            ) FILTER (WHERE m.id IS NOT NULL), '[]') AS medicos
     FROM estabelecimentos e
     LEFT JOIN medicos m ON m.estabelecimento_id = e.id AND m.ativo = TRUE
     WHERE e.id = $1
     GROUP BY e.id`,
    [id]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

// ===== Médicos =====
async function searchMedicos({ search, especialidade, convenio, estabelecimentoId }) {
  const params = [];
  const where = ['m.ativo = TRUE'];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    where.push(
      `(m.nome ILIKE $${idx} OR m.biografia ILIKE $${idx} OR $${idx} = ANY(m.especialidades))`
    );
  }

  if (especialidade) {
    params.push(especialidade);
    where.push(`$${params.length} = ANY(m.especialidades)`);
  }

  if (convenio) {
    params.push(convenio);
    where.push(`$${params.length} = ANY(m.convenios_aceitos)`);
  }

  if (estabelecimentoId) {
    params.push(estabelecimentoId);
    where.push(`m.estabelecimento_id = $${params.length}`);
  }

  let query = `SELECT m.*, e.nome AS estabelecimento_nome, e.endereco_completo, e.telefone AS estabelecimento_telefone
               FROM medicos m
               JOIN estabelecimentos e ON e.id = m.estabelecimento_id`;
  if (where.length) {
    query += ' WHERE ' + where.join(' AND ');
  }
  query += ' ORDER BY m.nome ASC LIMIT 100';

  const { rows } = await pool.query(query, params);
  return rows.map(mapRow);
}

async function findMedicoById(id) {
  const { rows } = await pool.query(
    `SELECT m.*, e.nome AS estabelecimento_nome, e.endereco_completo, e.telefone AS estabelecimento_telefone,
            e.horario_funcionamento
     FROM medicos m
     JOIN estabelecimentos e ON e.id = m.estabelecimento_id
     WHERE m.id = $1`,
    [id]
  );
  return mapRow(rows[0]);
}

async function createMedico(estabelecimentoId, data) {
  const {
    nome,
    crm,
    especialidades = [],
    conveniosAceitos = [],
    biografia = '',
    telefone = '',
    email = '',
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO medicos
      (nome, crm, especialidades, convenios_aceitos, biografia, telefone, email, estabelecimento_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [nome, crm, especialidades, conveniosAceitos, biografia, telefone, email, estabelecimentoId]
  );
  return mapRow(rows[0]);
}

async function findMedicoByCrm(crm) {
  const { rows } = await pool.query('SELECT * FROM medicos WHERE crm = $1', [crm]);
  return mapRow(rows[0]);
}

async function updateMedico(estabelecimentoId, medicoId, data) {
  const {
    nome,
    especialidades,
    conveniosAceitos,
    biografia,
    telefone,
    email,
  } = data;

  const { rows } = await pool.query(
    `UPDATE medicos
       SET nome = COALESCE($1, nome),
           especialidades = COALESCE($2, especialidades),
           convenios_aceitos = COALESCE($3, convenios_aceitos),
           biografia = COALESCE($4, biografia),
           telefone = COALESCE($5, telefone),
           email = COALESCE($6, email),
           updated_at = NOW()
     WHERE id = $7 AND estabelecimento_id = $8
     RETURNING *`,
    [
      nome || null,
      especialidades || null,
      conveniosAceitos || null,
      biografia || null,
      telefone || null,
      email || null,
      medicoId,
      estabelecimentoId,
    ]
  );
  return mapRow(rows[0]);
}

async function softDeleteMedico(estabelecimentoId, medicoId) {
  await pool.query(
    `UPDATE medicos SET ativo = FALSE, updated_at = NOW()
     WHERE id = $1 AND estabelecimento_id = $2`,
    [medicoId, estabelecimentoId]
  );
}

async function getDistinctEspecialidades() {
  const { rows } = await pool.query(
    `SELECT DISTINCT unnest(especialidades) AS especialidade
     FROM medicos
     WHERE ativo = TRUE`
  );
  return rows.map((r) => r.especialidade).filter(Boolean).sort();
}

async function getDistinctConvenios() {
  const { rows } = await pool.query(
    `SELECT DISTINCT unnest(convenios_gerais) AS convenio FROM estabelecimentos WHERE ativo = TRUE
     UNION
     SELECT DISTINCT unnest(convenios_aceitos) AS convenio FROM medicos WHERE ativo = TRUE`
  );
  return rows.map((r) => r.convenio).filter(Boolean).sort();
}

async function getDistinctTiposEstabelecimento() {
  const { rows } = await pool.query(
    `SELECT DISTINCT tipo FROM estabelecimentos WHERE ativo = TRUE`
  );
  return rows.map((r) => r.tipo).filter(Boolean);
}

// ===== Favoritos =====
async function addFavorito(usuarioId, estabelecimentoId) {
  await pool.query(
    `INSERT INTO favoritos (usuario_id, estabelecimento_id)
     VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [usuarioId, estabelecimentoId]
  );
}

async function removeFavorito(usuarioId, estabelecimentoId) {
  await pool.query(
    `DELETE FROM favoritos WHERE usuario_id = $1 AND estabelecimento_id = $2`,
    [usuarioId, estabelecimentoId]
  );
}

async function listarFavoritos(usuarioId) {
  const { rows } = await pool.query(
    `SELECT e.*
     FROM favoritos f
     JOIN estabelecimentos e ON e.id = f.estabelecimento_id
     WHERE f.usuario_id = $1`,
    [usuarioId]
  );
  return rows.map(mapRow);
}

async function isFavorito(usuarioId, estabelecimentoId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM favoritos WHERE usuario_id = $1 AND estabelecimento_id = $2`,
    [usuarioId, estabelecimentoId]
  );
  return rows.length > 0;
}

module.exports = {
  mapRow,
  // usuários
  findUsuarioByEmail,
  findUsuarioById,
  createUsuario,
  updateUsuarioLoginInfo,
  setUsuarioEstabelecimento,
  // estabelecimentos
  createEstabelecimento,
  updateEstabelecimentoByAdmin,
  findEstabelecimentoByAdmin,
  softDeleteEstabelecimentoByAdmin,
  findEstabelecimentoById,
  searchEstabelecimentos,
  getEstabelecimentosProximos,
  addAvaliacao,
  getEstabelecimentoDetalhado,
  // médicos
  searchMedicos,
  findMedicoById,
  createMedico,
  findMedicoByCrm,
  updateMedico,
  softDeleteMedico,
  getDistinctEspecialidades,
  getDistinctConvenios,
  getDistinctTiposEstabelecimento,
  // favoritos
  addFavorito,
  removeFavorito,
  listarFavoritos,
  isFavorito,
};


