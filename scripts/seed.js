require('dotenv').config();
const { pool } = require('../config/db');

// Dados de exemplo
const usuariosExemplo = [
    {
        nome: 'João Silva',
        email: 'joao@exemplo.com',
        senha: '123456',
        tipo: 'usuario'
    },
    {
        nome: 'Dr. Maria Santos',
        email: 'maria@clinica.com',
        senha: '123456',
        tipo: 'clinica'
    },
    {
        nome: 'Dr. Carlos Oliveira',
        email: 'carlos@hospital.com',
        senha: '123456',
        tipo: 'orgao_publico'
    }
];

const estabelecimentosExemplo = [
    {
        nome: 'Clínica São Paulo',
        cnpj: '12.345.678/0001-90',
        tipo: 'clinica',
        enderecoCompleto: 'Rua das Flores, 123, Centro, São Paulo - SP',
        telefone: '(11) 99999-9999',
        horarioFuncionamento: 'Segunda a Sexta: 8h às 18h',
        descricao: 'Clínica especializada em cardiologia e medicina geral',
        site: 'https://clinicaspaulo.com.br',
        conveniosGerais: ['Unimed', 'Bradesco Saúde', 'SulAmérica'],
        localizacao: {
            type: 'Point',
            coordinates: [-46.6333, -23.5505] // São Paulo
        },
        ativo: true
    },
    {
        nome: 'Hospital Municipal de Franca',
        cnpj: '98.765.432/0001-10',
        tipo: 'orgao_publico',
        enderecoCompleto: 'Av. Presidente Vargas, 456, Centro, Franca - SP',
        telefone: '(16) 99999-8888',
        horarioFuncionamento: '24 horas',
        descricao: 'Hospital público com atendimento de emergência e especialidades',
        conveniosGerais: ['SUS', 'Unimed'],
        localizacao: {
            type: 'Point',
            coordinates: [-49.9639, -20.4183] // Franca
        },
        ativo: true
    },
    {
        nome: 'Clínica Vida Saudável',
        cnpj: '11.222.333/0001-44',
        tipo: 'clinica',
        enderecoCompleto: 'Rua da Saúde, 789, Jardim América, Franca - SP',
        telefone: '(16) 99999-7777',
        horarioFuncionamento: 'Segunda a Sexta: 7h às 19h, Sábado: 8h às 12h',
        descricao: 'Clínica com foco em medicina preventiva e bem-estar',
        site: 'https://vidasaudavel.com.br',
        conveniosGerais: ['Bradesco Saúde', 'SulAmérica', 'NotreDame Intermédica'],
        localizacao: {
            type: 'Point',
            coordinates: [-49.9500, -20.4000] // Franca - região próxima
        },
        ativo: true
    }
];

const medicosExemplo = [
    {
        nome: 'Dr. Ana Costa',
        crm: '123456',
        especialidades: ['Cardiologia', 'Clínica Médica'],
        conveniosAceitos: ['Unimed', 'Bradesco Saúde', 'SulAmérica'],
        biografia: 'Cardiologista com 15 anos de experiência',
        telefone: '(11) 99999-1111',
        email: 'ana.costa@clinica.com',
        ativo: true
    },
    {
        nome: 'Dr. Pedro Mendes',
        crm: '789012',
        especialidades: ['Ortopedia', 'Traumatologia'],
        conveniosAceitos: ['SUS', 'Unimed'],
        biografia: 'Ortopedista especializado em cirurgia do joelho',
        telefone: '(16) 99999-2222',
        email: 'pedro.mendes@hospital.com',
        ativo: true
    },
    {
        nome: 'Dra. Lucia Fernandes',
        crm: '345678',
        especialidades: ['Pediatria', 'Clínica Médica'],
        conveniosAceitos: ['Bradesco Saúde', 'SulAmérica', 'NotreDame Intermédica'],
        biografia: 'Pediatra com especialização em neonatologia',
        telefone: '(16) 99999-3333',
        email: 'lucia.fernandes@clinica.com',
        ativo: true
    }
];

// Função para criar dados de exemplo em PostgreSQL
async function criarDadosExemplo() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Limpar dados existentes (ordem respeitando FKs)
    await client.query('DELETE FROM favoritos');
    await client.query('DELETE FROM avaliacoes');
    await client.query('DELETE FROM medicos');
    await client.query('DELETE FROM estabelecimentos');
    await client.query('DELETE FROM usuarios');

    console.log('Dados anteriores removidos');

    // Criar usuários
    const usuarios = [];
    for (const u of usuariosExemplo) {
      const { rows } = await client.query(
        `INSERT INTO usuarios (nome, email, senha, tipo)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [u.nome, u.email, u.senha, u.tipo]
      );
      usuarios.push(rows[0]);
      console.log(`Usuário criado: ${rows[0].nome}`);
    }

    // Criar estabelecimentos (usando usuários[1] e usuários[2] como admins)
    const estabelecimentos = [];
    for (let i = 0; i < estabelecimentosExemplo.length; i++) {
      const e = estabelecimentosExemplo[i];
      const admin = usuarios[i + 1];
      if (!admin) continue;

      const { rows } = await client.query(
        `INSERT INTO estabelecimentos
           (nome, cnpj, tipo, endereco_completo, telefone, horario_funcionamento,
            descricao, site, convenios_gerais, latitude, longitude, admin_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          e.nome,
          e.cnpj,
          e.tipo,
          e.enderecoCompleto,
          e.telefone,
          e.horarioFuncionamento,
          e.descricao,
          e.site || null,
          e.conveniosGerais || [],
          e.localizacao ? e.localizacao.coordinates[1] : null,
          e.localizacao ? e.localizacao.coordinates[0] : null,
          admin.id,
        ]
      );
      estabelecimentos.push(rows[0]);
      console.log(`Estabelecimento criado: ${rows[0].nome}`);
    }

    // Criar médicos
    for (let i = 0; i < medicosExemplo.length; i++) {
      const m = medicosExemplo[i];
      const est = estabelecimentos[i % estabelecimentos.length];
      const { rows } = await client.query(
        `INSERT INTO medicos
           (nome, crm, especialidades, convenios_aceitos, biografia, telefone, email, estabelecimento_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [
          m.nome,
          m.crm,
          m.especialidades || [],
          m.conveniosAceitos || [],
          m.biografia,
          m.telefone,
          m.email,
          est.id,
        ]
      );
      console.log(`Médico criado: ${rows[0].nome} - ${est.nome}`);
    }

    await client.query('COMMIT');

    console.log('Dados de exemplo criados com sucesso!');
    console.log('\nUsuários de teste:');
    console.log('Email: joao@exemplo.com | Senha: 123456 (Usuário comum)');
    console.log('Email: maria@clinica.com | Senha: 123456 (Clínica)');
    console.log('Email: carlos@hospital.com | Senha: 123456 (Órgão Público)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar dados de exemplo:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Executar script
async function main() {
  await criarDadosExemplo();
  console.log('Script finalizado');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { criarDadosExemplo };
