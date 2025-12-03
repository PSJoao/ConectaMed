require('dotenv').config();
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function seedVotuporanga() {
  const client = await pool.connect();
  try {
    console.log('Iniciando seed para Votuporanga/SP...');
    await client.query('BEGIN');

    // 1. Limpar tudo (ordem correta para respeitar FKs)
    await client.query('TRUNCATE TABLE favoritos CASCADE');
    await client.query('TRUNCATE TABLE avaliacoes CASCADE');
    await client.query('TRUNCATE TABLE medicos_estabelecimentos CASCADE');
    await client.query('TRUNCATE TABLE medicos CASCADE');
    await client.query('TRUNCATE TABLE estabelecimentos CASCADE');
    await client.query('TRUNCATE TABLE usuarios CASCADE');

    console.log('Banco de dados limpo.');

    // Senha padrão para testes: 123456
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);

    // 2. Criar Usuário Admin Geral (para teste)
    const { rows: [adminUser] } = await client.query(
      `INSERT INTO usuarios (nome, email, senha, tipo) 
       VALUES ('Admin Geral', 'admin@conectamed.com', $1, 'clinica') RETURNING id`,
      [hash]
    );

    // 3. Criar Estabelecimentos em Votuporanga
    // Coordenadas aproximadas de Votuporanga: -20.42, -49.97
    const estabelecimentosData = [
      {
        nome: 'Santa Casa de Votuporanga',
        tipo: 'orgao_publico',
        end: 'R. Osvaldo Padrovezi, 5000 - Parque Saude, Votuporanga - SP',
        tel: '(17) 3405-9133',
        lat: -20.4298, lng: -49.9625,
        conv: ['SUS', 'Iamspe', 'Unimed']
      },
      {
        nome: 'AME Votuporanga',
        tipo: 'orgao_publico',
        end: 'R. Maria de Freitas Leite, 2944 - Cidade Nova, Votuporanga - SP',
        tel: '(17) 3426-6000',
        lat: -20.4185, lng: -49.9750,
        conv: ['SUS']
      },
      {
        nome: 'UPA 24h Votuporanga',
        tipo: 'orgao_publico',
        end: 'Av. João Gonçalves Leite, 4705 - Jardim Alvorada, Votuporanga - SP',
        tel: '(17) 3422-5112',
        lat: -20.4350, lng: -49.9550,
        conv: ['SUS']
      },
      {
        nome: 'Hospital Unimed Votuporanga',
        tipo: 'clinica',
        end: 'R. Ponta Porã, 3133 - Centro, Votuporanga - SP',
        tel: '(17) 3405-9400',
        lat: -20.4220, lng: -49.9710,
        conv: ['Unimed', 'Particular']
      },
      {
        nome: 'Clínica Médica São Francisco',
        tipo: 'clinica',
        end: 'R. Tietê, 3500 - Santa Eliza, Votuporanga - SP',
        tel: '(17) 3421-1000',
        lat: -20.4250, lng: -49.9780,
        conv: ['Bradesco Saúde', 'SulAmérica', 'Unimed']
      },
      {
        nome: 'Centro Ortopédico Votuporanga',
        tipo: 'clinica',
        end: 'Av. Vale do Sol, 4500 - Vale do Sol, Votuporanga - SP',
        tel: '(17) 3423-2222',
        lat: -20.4150, lng: -49.9650,
        conv: ['Particular', 'Cassi', 'Unimed']
      }
    ];

    const estIds = [];

    for (const est of estabelecimentosData) {
      const { rows } = await client.query(
        `INSERT INTO estabelecimentos 
         (nome, tipo, endereco_completo, telefone, horario_funcionamento, latitude, longitude, convenios_gerais, admin_id, ativo)
         VALUES ($1, $2, $3, $4, 'Seg-Sex 08:00-18:00', $5, $6, $7, $8, true) RETURNING id`,
        [est.nome, est.tipo, est.end, est.tel, est.lat, est.lng, est.conv, adminUser.id]
      );
      estIds.push(rows[0].id);
      console.log(`Criado: ${est.nome}`);
    }

    // 4. Criar Médicos
    const medicosData = [
      { nome: 'Dr. João Silva', esp: ['Cardiologia'], crm: '12345-SP', conv: ['Unimed', 'SUS'] },
      { nome: 'Dra. Maria Oliveira', esp: ['Pediatria'], crm: '23456-SP', conv: ['Bradesco Saúde'] },
      { nome: 'Dr. Pedro Santos', esp: ['Ortopedia'], crm: '34567-SP', conv: ['SUS', 'Particular'] },
      { nome: 'Dra. Ana Costa', esp: ['Dermatologia'], crm: '45678-SP', conv: ['Unimed', 'SulAmérica'] },
      { nome: 'Dr. Lucas Pereira', esp: ['Neurologia'], crm: '56789-SP', conv: ['SUS'] },
      { nome: 'Dra. Julia Lima', esp: ['Ginecologia'], crm: '67890-SP', conv: ['Unimed'] },
      { nome: 'Dr. Marcos Souza', esp: ['Oftalmologia'], crm: '78901-SP', conv: ['Particular'] },
      { nome: 'Dra. Fernanda Alves', esp: ['Psiquiatria'], crm: '89012-SP', conv: ['Unimed', 'Cassi'] },
      { nome: 'Dr. Roberto Dias', esp: ['Urologia'], crm: '90123-SP', conv: ['Bradesco Saúde'] },
      { nome: 'Dra. Camila Rocha', esp: ['Endocrinologia'], crm: '01234-SP', conv: ['SUS', 'Unimed'] }
    ];

    for (let i = 0; i < medicosData.length; i++) {
      const m = medicosData[i];
      // Cria o médico
      const { rows: [medico] } = await client.query(
        `INSERT INTO medicos (nome, crm, especialidades, convenios_aceitos, biografia, telefone, email)
         VALUES ($1, $2, $3, $4, 'Médico especialista com vasta experiência.', '(17) 99999-9999', $5) RETURNING id`,
        [m.nome, m.crm, m.esp, m.conv, `medico${i}@exemplo.com`]
      );

      // Vincula médico a 1 ou 2 estabelecimentos aleatórios
      const estId1 = estIds[i % estIds.length];
      await client.query(
        `INSERT INTO medicos_estabelecimentos (medico_id, estabelecimento_id) VALUES ($1, $2)`,
        [medico.id, estId1]
      );

      // Alguns médicos trabalham em dois lugares
      if (i % 2 === 0) {
        const estId2 = estIds[(i + 1) % estIds.length];
        await client.query(
          `INSERT INTO medicos_estabelecimentos (medico_id, estabelecimento_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [medico.id, estId2]
        );
      }
      console.log(`Criado: ${m.nome}`);
    }

    await client.query('COMMIT');
    console.log('Seed Votuporanga concluído com sucesso!');
    console.log('Admin Login: admin@conectamed.com | Senha: 123456');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro no seed:', error);
  } finally {
    client.release();
    process.exit();
  }
}

seedVotuporanga();