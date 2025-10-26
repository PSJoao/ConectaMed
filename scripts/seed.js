const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos
const Usuario = require('../models/Usuario');
const Estabelecimento = require('../models/Estabelecimento');
const Medico = require('../models/Medico');

// Conectar ao MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/conectamed');
        console.log('MongoDB conectado');
    } catch (error) {
        console.error('Erro ao conectar MongoDB:', error);
        process.exit(1);
    }
}

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

// Função para criar dados de exemplo
async function criarDadosExemplo() {
    try {
        // Limpar dados existentes
        await Usuario.deleteMany({});
        await Estabelecimento.deleteMany({});
        await Medico.deleteMany({});

        console.log('Dados anteriores removidos');

        // Criar usuários
        const usuarios = [];
        for (const usuarioData of usuariosExemplo) {
            const usuario = new Usuario(usuarioData);
            await usuario.save();
            usuarios.push(usuario);
            console.log(`Usuário criado: ${usuario.nome}`);
        }

        // Criar estabelecimentos
        const estabelecimentos = [];
        for (let i = 0; i < estabelecimentosExemplo.length; i++) {
            const estabelecimentoData = estabelecimentosExemplo[i];
            const admin = usuarios[i + 1]; // Usar usuários de clínica/órgão público como admin
            
            if (!admin) {
                console.log(`Usuário admin não encontrado para estabelecimento ${i}`);
                continue;
            }
            
            const estabelecimento = new Estabelecimento({
                ...estabelecimentoData,
                admin: admin._id
            });
            
            await estabelecimento.save();
            estabelecimentos.push(estabelecimento);
            console.log(`Estabelecimento criado: ${estabelecimento.nome}`);
        }

        // Criar médicos
        for (let i = 0; i < medicosExemplo.length; i++) {
            const medicoData = medicosExemplo[i];
            const estabelecimento = estabelecimentos[i % estabelecimentos.length]; // Distribuir médicos entre estabelecimentos
            
            const medico = new Medico({
                ...medicoData,
                estabelecimento: estabelecimento._id
            });
            
            await medico.save();
            
            // Adicionar médico ao estabelecimento
            estabelecimento.medicos.push(medico._id);
            await estabelecimento.save();
            
            console.log(`Médico criado: ${medico.nome} - ${estabelecimento.nome}`);
        }

        console.log('Dados de exemplo criados com sucesso!');
        console.log('\nUsuários de teste:');
        console.log('Email: joao@exemplo.com | Senha: 123456 (Usuário comum)');
        console.log('Email: maria@clinica.com | Senha: 123456 (Clínica)');
        console.log('Email: carlos@hospital.com | Senha: 123456 (Órgão Público)');

    } catch (error) {
        console.error('Erro ao criar dados de exemplo:', error);
    }
}

// Executar script
async function main() {
    await connectDB();
    await criarDadosExemplo();
    await mongoose.connection.close();
    console.log('Script finalizado');
}

if (require.main === module) {
    main();
}

module.exports = { criarDadosExemplo };
