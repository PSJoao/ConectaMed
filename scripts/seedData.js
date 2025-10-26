// Script para adicionar dados de teste ao banco
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const Usuario = require('../models/Usuario');
const Medico = require('../models/Medico');
const Estabelecimento = require('../models/Estabelecimento');

// Dados de teste
const seedData = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado ao MongoDB');

        // Limpar dados existentes
        await Usuario.deleteMany({});
        await Medico.deleteMany({});
        await Estabelecimento.deleteMany({});
        console.log('Dados antigos removidos');

        // Criar usuário admin
        const admin = new Usuario({
            nome: 'Admin ConectaMed',
            email: 'admin@conectamed.com',
            senha: '123456',
            tipo: 'clinica'
        });
        await admin.save();
        console.log('Admin criado');

        // Criar estabelecimentos primeiro
        const estabelecimento1 = new Estabelecimento({
            nome: 'Clínica São Paulo',
            cnpj: '12.345.678/0001-90',
            tipo: 'clinica',
            enderecoCompleto: 'Rua das Flores, 123, Centro, São Paulo - SP',
            telefone: '(11) 3333-4444',
            horarioFuncionamento: 'Segunda a Sexta: 8h às 18h',
            localizacao: {
                type: 'Point',
                coordinates: [-46.6333, -23.5505] // São Paulo
            },
            conveniosGerais: ['SUS', 'Unimed', 'Bradesco Saúde', 'Amil'],
            medicos: [],
            admin: admin._id,
            descricao: 'Clínica especializada em atendimento geral e pediátrico.',
            site: 'https://www.clinicasaopaulo.com.br'
        });
        await estabelecimento1.save();

        const estabelecimento2 = new Estabelecimento({
            nome: 'Hospital Central',
            cnpj: '98.765.432/0001-10',
            tipo: 'orgao_publico',
            enderecoCompleto: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP',
            telefone: '(11) 2222-3333',
            horarioFuncionamento: '24 horas',
            localizacao: {
                type: 'Point',
                coordinates: [-46.6558, -23.5613] // Próximo à Paulista
            },
            conveniosGerais: ['SUS'],
            medicos: [],
            admin: admin._id,
            descricao: 'Hospital público com atendimento 24 horas.',
            site: 'https://www.hospitalcentral.gov.br'
        });
        await estabelecimento2.save();

        const estabelecimento3 = new Estabelecimento({
            nome: 'Clínica Especializada',
            cnpj: '11.222.333/0001-44',
            tipo: 'clinica',
            enderecoCompleto: 'Rua Augusta, 456, Consolação, São Paulo - SP',
            telefone: '(11) 4444-5555',
            horarioFuncionamento: 'Segunda a Sexta: 7h às 19h, Sábado: 8h às 12h',
            localizacao: {
                type: 'Point',
                coordinates: [-46.6608, -23.5613] // Rua Augusta
            },
            conveniosGerais: ['SUS', 'Unimed', 'SulAmérica'],
            medicos: [],
            admin: admin._id,
            descricao: 'Clínica especializada em cardiologia e ortopedia.',
            site: 'https://www.clinicaespecializada.com.br'
        });
        await estabelecimento3.save();

        // Criar médicos
        const medico1 = new Medico({
            nome: 'Dr. João Silva',
            crm: '123456',
            especialidades: ['Cardiologia', 'Clínica Geral'],
            conveniosAceitos: ['SUS', 'Unimed', 'Bradesco Saúde'],
            biografia: 'Especialista em cardiologia com 15 anos de experiência.',
            telefone: '(11) 99999-1111',
            email: 'joao.silva@email.com',
            estabelecimento: estabelecimento1._id
        });
        await medico1.save();

        const medico2 = new Medico({
            nome: 'Dra. Maria Santos',
            crm: '789012',
            especialidades: ['Pediatria', 'Clínica Geral'],
            conveniosAceitos: ['SUS', 'Amil', 'SulAmérica'],
            biografia: 'Pediatra especializada em atendimento infantil.',
            telefone: '(11) 99999-2222',
            email: 'maria.santos@email.com',
            estabelecimento: estabelecimento1._id
        });
        await medico2.save();

        const medico3 = new Medico({
            nome: 'Dr. Carlos Oliveira',
            crm: '345678',
            especialidades: ['Ortopedia', 'Traumatologia'],
            conveniosAceitos: ['SUS', 'Unimed', 'Bradesco Saúde'],
            biografia: 'Ortopedista especializado em cirurgias de coluna.',
            telefone: '(11) 99999-3333',
            email: 'carlos.oliveira@email.com',
            estabelecimento: estabelecimento2._id
        });
        await medico3.save();

        console.log('Médicos criados');

        // Atualizar estabelecimentos com médicos
        estabelecimento1.medicos = [medico1._id, medico2._id];
        await estabelecimento1.save();

        estabelecimento2.medicos = [medico3._id];
        await estabelecimento2.save();

        estabelecimento3.medicos = [medico1._id, medico3._id];
        await estabelecimento3.save();

        console.log('Estabelecimentos atualizados');

        // Atualizar admin com estabelecimento
        admin.estabelecimento = estabelecimento1._id;
        await admin.save();

        console.log('✅ Dados de teste criados com sucesso!');
        console.log('📊 Resumo:');
        console.log('- 1 Admin');
        console.log('- 3 Médicos');
        console.log('- 3 Estabelecimentos');
        
        process.exit(0);
    } catch (error) {
        console.error('Erro ao criar dados de teste:', error);
        process.exit(1);
    }
};

// Executar se chamado diretamente
if (require.main === module) {
    seedData();
}

module.exports = seedData;
