const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const readline = require('readline');

// CONFIGURACOES
const DB_FILE = path.join(__dirname, 'dados', 'clientes.json');
const MONGODB_URI = 'mongodb://localhost:27017/sistemaclientesupdate';

// Interface de linha de comando
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(pergunta) {
    return new Promise(resolve => {
        rl.question(pergunta, resolve);
    });
}

// SCHEMA MONGODB
const clienteSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'Nome e obrigatorio'],
        trim: true,
        minlength: [2, 'Nome deve ter pelo menos 2 caracteres']
    },
    cpf: {
        type: String,
        required: [true, 'CPF e obrigatorio'],
        unique: true,
        match: [/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalido']
    },
    telefone: {
        type: String,
        trim: true
    },
    endereco: {
        logradouro: String,
        numero: String,
        bairro: String,
        cidade: String,
        uf: String,
        cep: String
    },
    ativo: {
        type: Boolean,
        default: true
    },
    data_cadastro: {
        type: Date,
        default: Date.now
    },
    data_atualizacao: {
        type: Date,
        default: Date.now
    }
});

const Cliente = mongoose.model('Cliente', clienteSchema);

// VALIDACAO CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
}

function formatarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// CONEXAO MONGODB
async function conectarMongoDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        return true;
    } catch (error) {
        console.error('ERRO ao conectar MongoDB:', error.message);
        return false;
    }
}

// =============================================
// FUNCOES DE ATUALIZACAO JSON
// =============================================

function carregarClientesJSON() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Arquivo JSON nao encontrado. Retornando lista vazia');
        return [];
    }
}

function salvarClientesJSON(clientes) {
    try {
        const dir = path.dirname(DB_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const data = JSON.stringify(clientes, null, 4);
        fs.writeFileSync(DB_FILE, data, 'utf-8');
        console.log('Clientes salvos no JSON com sucesso!');
        return true;
    } catch (error) {
        console.error('ERRO ao salvar clientes:', error);
        return false;
    }
}

function buscarClienteJSONPorCPF(cpf) {
    const clientes = carregarClientesJSON();
    const cpfFormatado = formatarCPF(cpf);
    return clientes.find(cliente => cliente.cpf === cpfFormatado);
}

function buscarClienteJSONPorID(id) {
    const clientes = carregarClientesJSON();
    return clientes.find(cliente => cliente.id === parseInt(id));
}

function atualizarClienteJSON(identificador, novosDados) {
    try {
        const clientes = carregarClientesJSON();
        let clienteIndex = -1;
        
        // Buscar por CPF ou ID
        if (identificador.includes('.')) {
            // E um CPF
            const cpfFormatado = formatarCPF(identificador);
            clienteIndex = clientes.findIndex(cliente => cliente.cpf === cpfFormatado);
        } else {
            // E um ID
            clienteIndex = clientes.findIndex(cliente => cliente.id === parseInt(identificador));
        }
        
        if (clienteIndex === -1) {
            console.log('Cliente nao encontrado!');
            return false;
        }
        
        const clienteOriginal = { ...clientes[clienteIndex] };
        
        // Validar novos dados
        if (novosDados.cpf && !validarCPF(novosDados.cpf)) {
            console.log('ERRO: CPF invalido!');
            return false;
        }
        
        if (novosDados.email && novosDados.email.trim()) {
            const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
            if (!emailRegex.test(novosDados.email)) {
                console.log('ERRO: Email invalido!');
                return false;
            }
        }
        
        // Verificar se CPF ja existe em outro cliente
        if (novosDados.cpf) {
            const cpfFormatado = formatarCPF(novosDados.cpf);
            const cpfExiste = clientes.find((cliente, index) => 
                cliente.cpf === cpfFormatado && index !== clienteIndex
            );
            if (cpfExiste) {
                console.log('ERRO: CPF ja cadastrado para outro cliente!');
                return false;
            }
        }
        
        // Atualizar campos
        if (novosDados.nome && novosDados.nome.trim()) {
            clientes[clienteIndex].nome = novosDados.nome.trim();
        }
        if (novosDados.cpf) {
            clientes[clienteIndex].cpf = formatarCPF(novosDados.cpf);
        }
        if (novosDados.email !== undefined) {
            clientes[clienteIndex].email = novosDados.email.trim();
        }
        if (novosDados.telefone !== undefined) {
            clientes[clienteIndex].telefone = novosDados.telefone.trim();
        }
        
        // Atualizar data de modificacao
        clientes[clienteIndex].data_atualizacao = new Date().toISOString();
        
        // Salvar alteracoes
        if (salvarClientesJSON(clientes)) {
            console.log('\n=== CLIENTE ATUALIZADO (JSON) ===');
            console.log('DADOS ANTERIORES:');
            console.log(`Nome: ${clienteOriginal.nome}`);
            console.log(`CPF: ${clienteOriginal.cpf}`);
            console.log(`Email: ${clienteOriginal.email || 'Nao informado'}`);
            console.log(`Telefone: ${clienteOriginal.telefone || 'Nao informado'}`);
            
            console.log('\nDADOS ATUALIZADOS:');
            console.log(`Nome: ${clientes[clienteIndex].nome}`);
            console.log(`CPF: ${clientes[clienteIndex].cpf}`);
            console.log(`Email: ${clientes[clienteIndex].email || 'Nao informado'}`);
            console.log(`Telefone: ${clientes[clienteIndex].telefone || 'Nao informado'}`);
            console.log(`Atualizado em: ${new Date(clientes[clienteIndex].data_atualizacao).toLocaleString('pt-BR')}`);
            
            return true;
        }
        return false;
        
    } catch (error) {
        console.error('ERRO ao atualizar cliente JSON:', error);
        return false;
    }
}

// =============================================
// FUNCOES DE ATUALIZACAO MONGODB
// =============================================

async function buscarClienteMongoDBPorCPF(cpf) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        const cliente = await Cliente.findOne({ cpf: cpfFormatado });
        return cliente;
    } catch (error) {
        console.error('ERRO ao buscar cliente MongoDB:', error);
        return null;
    }
}

async function buscarClienteMongoDBPorID(id) {
    try {
        const cliente = await Cliente.findById(id);
        return cliente;
    } catch (error) {
        console.error('ERRO ao buscar cliente MongoDB por ID:', error);
        return null;
    }
}

async function atualizarClienteMongoDB(cpf, novosDados) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        
        // Verificar se cliente existe
        const clienteExistente = await Cliente.findOne({ cpf: cpfFormatado });
        if (!clienteExistente) {
            console.log('Cliente nao encontrado no MongoDB!');
            return false;
        }
        
        // Validar novos dados
        if (novosDados.cpf && !validarCPF(novosDados.cpf)) {
            console.log('ERRO: CPF invalido!');
            return false;
        }
        
        // Verificar se novo CPF ja existe
        if (novosDados.cpf) {
            const novoCpfFormatado = formatarCPF(novosDados.cpf);
            if (novoCpfFormatado !== cpfFormatado) {
                const cpfJaExiste = await Cliente.findOne({ cpf: novoCpfFormatado });
                if (cpfJaExiste) {
                    console.log('ERRO: CPF ja cadastrado para outro cliente!');
                    return false;
                }
            }
        }
        
        // Preparar dados para atualizacao
        const dadosAtualizacao = {
            data_atualizacao: new Date()
        };
        
        if (novosDados.nome && novosDados.nome.trim()) {
            dadosAtualizacao.nome = novosDados.nome.trim();
        }
        if (novosDados.cpf) {
            dadosAtualizacao.cpf = formatarCPF(novosDados.cpf);
        }
        if (novosDados.email !== undefined) {
            dadosAtualizacao.email = novosDados.email.trim();
        }
        if (novosDados.telefone !== undefined) {
            dadosAtualizacao.telefone = novosDados.telefone.trim();
        }
        if (novosDados.ativo !== undefined) {
            dadosAtualizacao.ativo = novosDados.ativo;
        }
        
        // Atualizar endereco se fornecido
        if (novosDados.endereco) {
            dadosAtualizacao.endereco = {
                ...clienteExistente.endereco,
                ...novosDados.endereco
            };
        }
        
        // Executar atualizacao
        const clienteAtualizado = await Cliente.findOneAndUpdate(
            { cpf: cpfFormatado },
            dadosAtualizacao,
            { new: true, runValidators: true }
        );
        
        if (clienteAtualizado) {
            console.log('\n=== CLIENTE ATUALIZADO (MONGODB) ===');
            console.log(`ID: ${clienteAtualizado._id}`);
            console.log(`Nome: ${clienteAtualizado.nome}`);
            console.log(`CPF: ${clienteAtualizado.cpf}`);
            console.log(`Email: ${clienteAtualizado.email || 'Nao informado'}`);
            console.log(`Telefone: ${clienteAtualizado.telefone || 'Nao informado'}`);
            console.log(`Status: ${clienteAtualizado.ativo ? 'Ativo' : 'Inativo'}`);
            if (clienteAtualizado.endereco && clienteAtualizado.endereco.cidade) {
                console.log(`Cidade: ${clienteAtualizado.endereco.cidade}`);
            }
            console.log(`Cadastrado: ${clienteAtualizado.data_cadastro.toLocaleString('pt-BR')}`);
            console.log(`Atualizado: ${clienteAtualizado.data_atualizacao.toLocaleString('pt-BR')}`);
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('ERRO ao atualizar cliente MongoDB:', error.message);
        return false;
    }
}

// =============================================
// MENU INTERATIVO
// =============================================

async function mostrarMenuPrincipal() {
    console.clear();
    console.log('======= SISTEMA DE ATUALIZACAO DE CLIENTES =======');
    console.log('');
    console.log('OPCOES DISPONIVEIS:');
    console.log('1 - Atualizar Cliente no Sistema JSON');
    console.log('2 - Atualizar Cliente no MongoDB');
    console.log('3 - Buscar Cliente JSON (por CPF ou ID)');
    console.log('4 - Buscar Cliente MongoDB (por CPF)');
    console.log('5 - Listar Todos os Clientes JSON');
    console.log('0 - Sair');
    console.log('='.repeat(55));

    const opcao = await perguntar('\n>>> Escolha uma opcao: ');
    return opcao.trim();
}

async function menuAtualizarJSON() {
    console.log('\n--- ATUALIZACAO JSON ---');
    const identificador = await perguntar('Digite o CPF ou ID do cliente: ');
    
    // Buscar cliente primeiro
    let cliente = null;
    if (identificador.includes('.')) {
        cliente = buscarClienteJSONPorCPF(identificador);
    } else {
        cliente = buscarClienteJSONPorID(identificador);
    }
    
    if (!cliente) {
        console.log('Cliente nao encontrado!');
        return;
    }
    
    console.log('\nCliente encontrado:');
    console.log(`Nome: ${cliente.nome}`);
    console.log(`CPF: ${cliente.cpf}`);
    console.log(`Email: ${cliente.email || 'Nao informado'}`);
    console.log(`Telefone: ${cliente.telefone || 'Nao informado'}`);
    
    console.log('\nDigite os novos dados (deixe vazio para manter):');
    const novoNome = await perguntar('Novo nome: ');
    const novoCpf = await perguntar('Novo CPF: ');
    const novoEmail = await perguntar('Novo email: ');
    const novoTelefone = await perguntar('Novo telefone: ');
    
    const dadosAtualizacao = {};
    if (novoNome.trim()) dadosAtualizacao.nome = novoNome;
    if (novoCpf.trim()) dadosAtualizacao.cpf = novoCpf;
    if (novoEmail.trim() || novoEmail === '') dadosAtualizacao.email = novoEmail;
    if (novoTelefone.trim() || novoTelefone === '') dadosAtualizacao.telefone = novoTelefone;
    
    if (Object.keys(dadosAtualizacao).length === 0) {
        console.log('Nenhuma alteracao foi feita.');
        return;
    }
    
    atualizarClienteJSON(identificador, dadosAtualizacao);
}

async function menuAtualizarMongoDB() {
    const conectado = await conectarMongoDB();
    if (!conectado) return;
    
    console.log('\n--- ATUALIZACAO MONGODB ---');
    const cpf = await perguntar('Digite o CPF do cliente: ');
    
    // Buscar cliente primeiro
    const cliente = await buscarClienteMongoDBPorCPF(cpf);
    if (!cliente) {
        console.log('Cliente nao encontrado no MongoDB!');
        return;
    }
    
    console.log('\nCliente encontrado:');
    console.log(`Nome: ${cliente.nome}`);
    console.log(`CPF: ${cliente.cpf}`);
    console.log(`Email: ${cliente.email || 'Nao informado'}`);
    console.log(`Telefone: ${cliente.telefone || 'Nao informado'}`);
    console.log(`Status: ${cliente.ativo ? 'Ativo' : 'Inativo'}`);
    
    console.log('\nDigite os novos dados (deixe vazio para manter):');
    const novoNome = await perguntar('Novo nome: ');
    const novoCpf = await perguntar('Novo CPF: ');
    const novoEmail = await perguntar('Novo email: ');
    const novoTelefone = await perguntar('Novo telefone: ');
    const novaCidade = await perguntar('Nova cidade: ');
    const ativoResposta = await perguntar('Cliente ativo? (s/n/deixe vazio para manter): ');
    
    const dadosAtualizacao = {};
    if (novoNome.trim()) dadosAtualizacao.nome = novoNome;
    if (novoCpf.trim()) dadosAtualizacao.cpf = novoCpf;
    if (novoEmail.trim() || novoEmail === '') dadosAtualizacao.email = novoEmail;
    if (novoTelefone.trim() || novoTelefone === '') dadosAtualizacao.telefone = novoTelefone;
    if (novaCidade.trim()) {
        dadosAtualizacao.endereco = { cidade: novaCidade };
    }
    if (ativoResposta.toLowerCase() === 's') dadosAtualizacao.ativo = true;
    else if (ativoResposta.toLowerCase() === 'n') dadosAtualizacao.ativo = false;
    
    if (Object.keys(dadosAtualizacao).length === 0) {
        console.log('Nenhuma alteracao foi feita.');
        return;
    }
    
    await atualizarClienteMongoDB(cpf, dadosAtualizacao);
}

async function listarClientesJSON() {
    const clientes = carregarClientesJSON();
    if (clientes.length === 0) {
        console.log('Nenhum cliente encontrado no sistema JSON.');
        return;
    }
    
    console.log('\n=== CLIENTES NO SISTEMA JSON ===');
    clientes.forEach(cliente => {
        console.log(`ID: ${cliente.id} | Nome: ${cliente.nome} | CPF: ${cliente.cpf}`);
    });
}

async function executarSistema() {
    console.log('Iniciando Sistema de Atualizacao de Clientes...\n');

    while (true) {
        const opcao = await mostrarMenuPrincipal();

        switch (opcao) {
            case '1':
                await menuAtualizarJSON();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '2':
                await menuAtualizarMongoDB();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '3':
                const identificador = await perguntar('Digite CPF ou ID: ');
                let cliente;
                if (identificador.includes('.')) {
                    cliente = buscarClienteJSONPorCPF(identificador);
                } else {
                    cliente = buscarClienteJSONPorID(identificador);
                }
                
                if (cliente) {
                    console.log('\n=== CLIENTE ENCONTRADO ===');
                    console.log(`ID: ${cliente.id}`);
                    console.log(`Nome: ${cliente.nome}`);
                    console.log(`CPF: ${cliente.cpf}`);
                    console.log(`Email: ${cliente.email || 'Nao informado'}`);
                    console.log(`Telefone: ${cliente.telefone || 'Nao informado'}`);
                } else {
                    console.log('Cliente nao encontrado.');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '4':
                const conectado = await conectarMongoDB();
                if (conectado) {
                    const cpfBusca = await perguntar('Digite o CPF: ');
                    const clienteMongo = await buscarClienteMongoDBPorCPF(cpfBusca);
                    
                    if (clienteMongo) {
                        console.log('\n=== CLIENTE ENCONTRADO (MONGODB) ===');
                        console.log(`ID: ${clienteMongo._id}`);
                        console.log(`Nome: ${clienteMongo.nome}`);
                        console.log(`CPF: ${clienteMongo.cpf}`);
                        console.log(`Email: ${clienteMongo.email || 'Nao informado'}`);
                        console.log(`Telefone: ${clienteMongo.telefone || 'Nao informado'}`);
                        console.log(`Status: ${clienteMongo.ativo ? 'Ativo' : 'Inativo'}`);
                    } else {
                        console.log('Cliente nao encontrado no MongoDB.');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '5':
                await listarClientesJSON();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '0':
                console.log('Encerrando sistema...');
                rl.close();
                if (mongoose.connection.readyState === 1) {
                    await mongoose.connection.close();
                }
                process.exit(0);
                break;

            default:
                console.log('ERRO: Opcao invalida!');
                await perguntar('Pressione Enter para continuar...');
        }
    }
}

// EXPORTACOES
module.exports = {
    // JSON Functions
    carregarClientesJSON,
    salvarClientesJSON,
    buscarClienteJSONPorCPF,
    buscarClienteJSONPorID,
    atualizarClienteJSON,
    
    // MongoDB Functions
    conectarMongoDB,
    buscarClienteMongoDBPorCPF,
    buscarClienteMongoDBPorID,
    atualizarClienteMongoDB,
    
    // Utils
    validarCPF,
    formatarCPF,
    
    // System
    executarSistema
};

// EXECUCAO PRINCIPAL
if (require.main === module) {
    executarSistema().catch(console.error);
}