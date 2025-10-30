const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const readline = require('readline');

// CONFIGURACOES
const DB_FILE = path.join(__dirname, 'dados', 'clientes.json');
const MONGODB_URI = 'mongodb://localhost:27017/sistemaclientesread';

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
// FUNCOES DE LEITURA JSON
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

function listarTodosClientesJSON() {
    const clientes = carregarClientesJSON();
    if (clientes.length === 0) {
        console.log('Nenhum cliente encontrado no sistema JSON.');
        return [];
    }
    
    console.log('\n=== TODOS OS CLIENTES (JSON) ===');
    clientes.forEach((cliente, index) => {
        console.log(`${index + 1}. ID: ${cliente.id}`);
        console.log(`   Nome: ${cliente.nome}`);
        console.log(`   CPF: ${cliente.cpf}`);
        if (cliente.email) console.log(`   Email: ${cliente.email}`);
        if (cliente.telefone) console.log(`   Telefone: ${cliente.telefone}`);
        console.log(`   Cadastro: ${new Date(cliente.data_cadastro).toLocaleString('pt-BR')}`);
        console.log('-'.repeat(50));
    });
    
    return clientes;
}

function buscarClienteJSONPorCPF(cpf) {
    const clientes = carregarClientesJSON();
    const cpfFormatado = formatarCPF(cpf);
    const cliente = clientes.find(c => c.cpf === cpfFormatado);
    
    if (cliente) {
        console.log('\n=== CLIENTE ENCONTRADO (JSON) ===');
        console.log(`ID: ${cliente.id}`);
        console.log(`Nome: ${cliente.nome}`);
        console.log(`CPF: ${cliente.cpf}`);
        console.log(`Email: ${cliente.email || 'Nao informado'}`);
        console.log(`Telefone: ${cliente.telefone || 'Nao informado'}`);
        console.log(`Cadastro: ${new Date(cliente.data_cadastro).toLocaleString('pt-BR')}`);
        if (cliente.data_atualizacao) {
            console.log(`Ultima atualizacao: ${new Date(cliente.data_atualizacao).toLocaleString('pt-BR')}`);
        }
    } else {
        console.log('Cliente nao encontrado no sistema JSON.');
    }
    
    return cliente;
}

function buscarClienteJSONPorID(id) {
    const clientes = carregarClientesJSON();
    const cliente = clientes.find(c => c.id === parseInt(id));
    
    if (cliente) {
        console.log('\n=== CLIENTE ENCONTRADO (JSON) ===');
        console.log(`ID: ${cliente.id}`);
        console.log(`Nome: ${cliente.nome}`);
        console.log(`CPF: ${cliente.cpf}`);
        console.log(`Email: ${cliente.email || 'Nao informado'}`);
        console.log(`Telefone: ${cliente.telefone || 'Nao informado'}`);
        console.log(`Cadastro: ${new Date(cliente.data_cadastro).toLocaleString('pt-BR')}`);
    } else {
        console.log('Cliente nao encontrado no sistema JSON.');
    }
    
    return cliente;
}

function buscarClientesJSONPorNome(nome) {
    const clientes = carregarClientesJSON();
    const nomeSearch = nome.toLowerCase();
    const clientesEncontrados = clientes.filter(c => 
        c.nome.toLowerCase().includes(nomeSearch)
    );
    
    if (clientesEncontrados.length > 0) {
        console.log(`\n=== ${clientesEncontrados.length} CLIENTE(S) ENCONTRADO(S) (JSON) ===`);
        clientesEncontrados.forEach((cliente, index) => {
            console.log(`${index + 1}. ID: ${cliente.id}`);
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Email: ${cliente.email || 'Nao informado'}`);
            console.log('-'.repeat(40));
        });
    } else {
        console.log('Nenhum cliente encontrado com esse nome no sistema JSON.');
    }
    
    return clientesEncontrados;
}

function estatisticasJSON() {
    const clientes = carregarClientesJSON();
    
    console.log('\n=== ESTATISTICAS DO SISTEMA JSON ===');
    console.log(`Total de clientes: ${clientes.length}`);
    
    if (clientes.length > 0) {
        const comEmail = clientes.filter(c => c.email && c.email.trim()).length;
        const comTelefone = clientes.filter(c => c.telefone && c.telefone.trim()).length;
        
        console.log(`Clientes com email: ${comEmail}`);
        console.log(`Clientes com telefone: ${comTelefone}`);
        
        // Cliente mais recente
        const maisRecente = clientes.reduce((mais, atual) => {
            return new Date(atual.data_cadastro) > new Date(mais.data_cadastro) ? atual : mais;
        });
        
        console.log(`Cliente mais recente: ${maisRecente.nome} (${new Date(maisRecente.data_cadastro).toLocaleDateString('pt-BR')})`);
    }
}

// =============================================
// FUNCOES DE LEITURA MONGODB
// =============================================

async function listarTodosClientesMongoDB(limite = 0) {
    try {
        let query = Cliente.find().sort({ data_cadastro: -1 });
        
        if (limite > 0) {
            query = query.limit(limite);
        }
        
        const clientes = await query;
        
        if (clientes.length === 0) {
            console.log('Nenhum cliente encontrado no MongoDB.');
            return [];
        }
        
        console.log(`\n=== ${clientes.length} CLIENTE(S) NO MONGODB ===`);
        clientes.forEach((cliente, index) => {
            console.log(`${index + 1}. ID: ${cliente._id}`);
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Email: ${cliente.email || 'Nao informado'}`);
            console.log(`   Telefone: ${cliente.telefone || 'Nao informado'}`);
            console.log(`   Status: ${cliente.ativo ? 'Ativo' : 'Inativo'}`);
            if (cliente.endereco && cliente.endereco.cidade) {
                console.log(`   Cidade: ${cliente.endereco.cidade}`);
            }
            console.log(`   Cadastro: ${cliente.data_cadastro.toLocaleString('pt-BR')}`);
            console.log('-'.repeat(50));
        });
        
        return clientes;
    } catch (error) {
        console.error('ERRO ao listar clientes MongoDB:', error.message);
        return [];
    }
}

async function buscarClienteMongoDBPorCPF(cpf) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        const cliente = await Cliente.findOne({ cpf: cpfFormatado });
        
        if (cliente) {
            console.log('\n=== CLIENTE ENCONTRADO (MONGODB) ===');
            console.log(`ID: ${cliente._id}`);
            console.log(`Nome: ${cliente.nome}`);
            console.log(`CPF: ${cliente.cpf}`);
            console.log(`Email: ${cliente.email || 'Nao informado'}`);
            console.log(`Telefone: ${cliente.telefone || 'Nao informado'}`);
            console.log(`Status: ${cliente.ativo ? 'Ativo' : 'Inativo'}`);
            
            if (cliente.endereco) {
                console.log('--- ENDERECO ---');
                if (cliente.endereco.logradouro) console.log(`Logradouro: ${cliente.endereco.logradouro}`);
                if (cliente.endereco.numero) console.log(`Numero: ${cliente.endereco.numero}`);
                if (cliente.endereco.bairro) console.log(`Bairro: ${cliente.endereco.bairro}`);
                if (cliente.endereco.cidade) console.log(`Cidade: ${cliente.endereco.cidade}`);
                if (cliente.endereco.uf) console.log(`UF: ${cliente.endereco.uf}`);
                if (cliente.endereco.cep) console.log(`CEP: ${cliente.endereco.cep}`);
            }
            
            console.log(`Cadastro: ${cliente.data_cadastro.toLocaleString('pt-BR')}`);
            console.log(`Ultima atualizacao: ${cliente.data_atualizacao.toLocaleString('pt-BR')}`);
        } else {
            console.log('Cliente nao encontrado no MongoDB.');
        }
        
        return cliente;
    } catch (error) {
        console.error('ERRO ao buscar cliente MongoDB:', error.message);
        return null;
    }
}

async function buscarClienteMongoDBPorID(id) {
    try {
        const cliente = await Cliente.findById(id);
        
        if (cliente) {
            console.log('\n=== CLIENTE ENCONTRADO (MONGODB) ===');
            console.log(`ID: ${cliente._id}`);
            console.log(`Nome: ${cliente.nome}`);
            console.log(`CPF: ${cliente.cpf}`);
            console.log(`Email: ${cliente.email || 'Nao informado'}`);
            console.log(`Status: ${cliente.ativo ? 'Ativo' : 'Inativo'}`);
        } else {
            console.log('Cliente nao encontrado no MongoDB.');
        }
        
        return cliente;
    } catch (error) {
        console.error('ERRO ao buscar cliente MongoDB por ID:', error.message);
        return null;
    }
}

async function buscarClientesMongoDBPorNome(nome) {
    try {
        const clientes = await Cliente.find({
            nome: { $regex: nome, $options: 'i' }
        }).sort({ nome: 1 });
        
        if (clientes.length > 0) {
            console.log(`\n=== ${clientes.length} CLIENTE(S) ENCONTRADO(S) (MONGODB) ===`);
            clientes.forEach((cliente, index) => {
                console.log(`${index + 1}. Nome: ${cliente.nome}`);
                console.log(`   CPF: ${cliente.cpf}`);
                console.log(`   Email: ${cliente.email || 'Nao informado'}`);
                console.log(`   Status: ${cliente.ativo ? 'Ativo' : 'Inativo'}`);
                console.log('-'.repeat(40));
            });
        } else {
            console.log('Nenhum cliente encontrado com esse nome no MongoDB.');
        }
        
        return clientes;
    } catch (error) {
        console.error('ERRO ao buscar clientes por nome:', error.message);
        return [];
    }
}

async function buscarClientesMongoDBPorCidade(cidade) {
    try {
        const clientes = await Cliente.find({
            'endereco.cidade': { $regex: cidade, $options: 'i' }
        }).sort({ nome: 1 });
        
        if (clientes.length > 0) {
            console.log(`\n=== ${clientes.length} CLIENTE(S) EM ${cidade.toUpperCase()} ===`);
            clientes.forEach((cliente, index) => {
                console.log(`${index + 1}. Nome: ${cliente.nome}`);
                console.log(`   CPF: ${cliente.cpf}`);
                console.log(`   Cidade: ${cliente.endereco.cidade}`);
                console.log('-'.repeat(40));
            });
        } else {
            console.log(`Nenhum cliente encontrado na cidade: ${cidade}`);
        }
        
        return clientes;
    } catch (error) {
        console.error('ERRO ao buscar clientes por cidade:', error.message);
        return [];
    }
}

async function listarClientesMongoDBAtivos() {
    try {
        const clientes = await Cliente.find({ ativo: true }).sort({ nome: 1 });
        
        console.log(`\n=== ${clientes.length} CLIENTE(S) ATIVO(S) ===`);
        clientes.forEach((cliente, index) => {
            console.log(`${index + 1}. ${cliente.nome} - ${cliente.cpf}`);
        });
        
        return clientes;
    } catch (error) {
        console.error('ERRO ao listar clientes ativos:', error.message);
        return [];
    }
}

async function estatisticasMongoDB() {
    try {
        const total = await Cliente.countDocuments();
        const ativos = await Cliente.countDocuments({ ativo: true });
        const inativos = await Cliente.countDocuments({ ativo: false });
        const comEmail = await Cliente.countDocuments({ email: { $exists: true, $ne: '' } });
        const comTelefone = await Cliente.countDocuments({ telefone: { $exists: true, $ne: '' } });
        
        console.log('\n=== ESTATISTICAS DO MONGODB ===');
        console.log(`Total de clientes: ${total}`);
        console.log(`Clientes ativos: ${ativos}`);
        console.log(`Clientes inativos: ${inativos}`);
        console.log(`Clientes com email: ${comEmail}`);
        console.log(`Clientes com telefone: ${comTelefone}`);
        
        if (total > 0) {
            // Cliente mais recente
            const maisRecente = await Cliente.findOne().sort({ data_cadastro: -1 });
            console.log(`Cliente mais recente: ${maisRecente.nome} (${maisRecente.data_cadastro.toLocaleDateString('pt-BR')})`);
            
            // Cidades com mais clientes
            const cidades = await Cliente.aggregate([
                { $match: { 'endereco.cidade': { $exists: true, $ne: '' } } },
                { $group: { _id: '$endereco.cidade', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]);
            
            if (cidades.length > 0) {
                console.log('\nCidades com mais clientes:');
                cidades.forEach((cidade, index) => {
                    console.log(`${index + 1}. ${cidade._id}: ${cidade.count} cliente(s)`);
                });
            }
        }
        
        return { total, ativos, inativos, comEmail, comTelefone };
    } catch (error) {
        console.error('ERRO ao obter estatisticas:', error.message);
        return null;
    }
}

// =============================================
// MENU INTERATIVO
// =============================================

async function mostrarMenuPrincipal() {
    console.clear();
    console.log('======= SISTEMA DE LEITURA DE CLIENTES =======');
    console.log('');
    console.log('OPCOES DISPONIVEIS:');
    console.log('1 - Listar Todos os Clientes JSON');
    console.log('2 - Buscar Cliente JSON (por CPF)');
    console.log('3 - Buscar Cliente JSON (por ID)');
    console.log('4 - Buscar Cliente JSON (por Nome)');
    console.log('5 - Estatisticas JSON');
    console.log('6 - Listar Todos os Clientes MongoDB');
    console.log('7 - Buscar Cliente MongoDB (por CPF)');
    console.log('8 - Buscar Cliente MongoDB (por Nome)');
    console.log('9 - Buscar Clientes por Cidade');
    console.log('10 - Listar Clientes Ativos');
    console.log('11 - Estatisticas MongoDB');
    console.log('0 - Sair');
    console.log('='.repeat(50));

    const opcao = await perguntar('\n>>> Escolha uma opcao: ');
    return opcao.trim();
}

async function executarSistema() {
    console.log('Iniciando Sistema de Leitura de Clientes...\n');

    while (true) {
        const opcao = await mostrarMenuPrincipal();

        switch (opcao) {
            case '1':
                listarTodosClientesJSON();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '2':
                const cpfJSON = await perguntar('Digite o CPF: ');
                if (cpfJSON.trim()) {
                    buscarClienteJSONPorCPF(cpfJSON);
                } else {
                    console.log('CPF e obrigatorio!');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '3':
                const idJSON = await perguntar('Digite o ID: ');
                if (idJSON.trim()) {
                    buscarClienteJSONPorID(idJSON);
                } else {
                    console.log('ID e obrigatorio!');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '4':
                const nomeJSON = await perguntar('Digite parte do nome: ');
                if (nomeJSON.trim()) {
                    buscarClientesJSONPorNome(nomeJSON);
                } else {
                    console.log('Nome e obrigatorio!');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '5':
                estatisticasJSON();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '6':
                const conectado = await conectarMongoDB();
                if (conectado) {
                    const limite = await perguntar('Limite de resultados (0 para todos): ');
                    await listarTodosClientesMongoDB(parseInt(limite) || 0);
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '7':
                const conectado2 = await conectarMongoDB();
                if (conectado2) {
                    const cpfMongo = await perguntar('Digite o CPF: ');
                    if (cpfMongo.trim()) {
                        await buscarClienteMongoDBPorCPF(cpfMongo);
                    } else {
                        console.log('CPF e obrigatorio!');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '8':
                const conectado3 = await conectarMongoDB();
                if (conectado3) {
                    const nomeMongo = await perguntar('Digite parte do nome: ');
                    if (nomeMongo.trim()) {
                        await buscarClientesMongoDBPorNome(nomeMongo);
                    } else {
                        console.log('Nome e obrigatorio!');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '9':
                const conectado4 = await conectarMongoDB();
                if (conectado4) {
                    const cidade = await perguntar('Digite a cidade: ');
                    if (cidade.trim()) {
                        await buscarClientesMongoDBPorCidade(cidade);
                    } else {
                        console.log('Cidade e obrigatoria!');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '10':
                const conectado5 = await conectarMongoDB();
                if (conectado5) {
                    await listarClientesMongoDBAtivos();
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '11':
                const conectado6 = await conectarMongoDB();
                if (conectado6) {
                    await estatisticasMongoDB();
                }
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
    listarTodosClientesJSON,
    buscarClienteJSONPorCPF,
    buscarClienteJSONPorID,
    buscarClientesJSONPorNome,
    estatisticasJSON,
    
    // MongoDB Functions
    conectarMongoDB,
    listarTodosClientesMongoDB,
    buscarClienteMongoDBPorCPF,
    buscarClienteMongoDBPorID,
    buscarClientesMongoDBPorNome,
    buscarClientesMongoDBPorCidade,
    listarClientesMongoDBAtivos,
    estatisticasMongoDB,
    
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