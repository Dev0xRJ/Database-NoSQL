const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Importa??es dos m?dulos especializados
const { 
    conectarBanco: conectarMongoDB,
    adicionarCliente: adicionarClienteMongoDB,
    buscarClientes: listarClientesMongoDB,
    buscarClientePorCpf: buscarClienteMongoDB,
    atualizarCliente: atualizarClienteMongoDB,
    removerCliente: removerClienteMongoDB
} = require('./crudeCreate.js');

const { validarCPF } = require('./cliente.js');

// Configuracoes
const DB_FILE = path.join(__dirname, 'dados', 'clientes.json');
const MONGODB_URI = 'mongodb://localhost:27017/sistemaclientescompass';

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

// FUNCOES JSON (Sistema Local)
/**
 * Carrega clientes do arquivo JSON
 * @returns {Array<Object>} Lista de clientes
 */
function carregarClientes() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Arquivo de dados nao encontrado. Retornando lista vazia');
        return [];
    }
}

/**
 * Salva clientes no arquivo JSON
 * @param {Array<Object>} clientes Lista de clientes
 */
function salvarClientes(clientes) {
    try {
        const dir = path.dirname(DB_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const data = JSON.stringify(clientes, null, 4);
        fs.writeFileSync(DB_FILE, data, 'utf-8');
        console.log('Clientes salvos no arquivo JSON com sucesso!');
    } catch (error) {
        console.error('ERRO ao salvar clientes:', error);
    }
}

/**
 * Adiciona cliente no sistema JSON
 * @param {string} nome Nome do cliente
 * @param {string} cpf CPF do cliente
 * @param {string} email Email do cliente
 * @param {string} telefone Telefone do cliente
 */
function adicionarClienteJSON(nome, cpf, email = '', telefone = '') {
    if (!validarCPF(cpf)) {
        console.error('ERRO: CPF invalido!');
        return false;
    }

    const clientes = carregarClientes();
    
    const clienteExistente = clientes.find(cliente => cliente.cpf === cpf);
    if (clienteExistente) {
        console.error('ERRO: CPF ja cadastrado no sistema JSON!');
        return false;
    }
    
    const novoCliente = {
        id: clientes.length + 1,
        nome: nome.trim(),
        cpf,
        email: email.trim(),
        telefone: telefone.trim(),
        data_cadastro: new Date().toISOString()
    };
    
    clientes.push(novoCliente);
    salvarClientes(clientes);
    console.log('Cliente adicionado ao JSON:', novoCliente);
    return true;
}

/**
 * Lista clientes do sistema JSON
 */
function listarClientesJSON() {
    const clientes = carregarClientes();
    if (clientes.length === 0) {
        console.log('Nenhum cliente cadastrado no sistema JSON.');
        return;
    }
    
    console.log('\n=== CLIENTES NO SISTEMA JSON ===');
    clientes.forEach(cliente => {
        console.log(`ID: ${cliente.id}`);
        console.log(`Nome: ${cliente.nome}`);
        console.log(`CPF: ${cliente.cpf}`);
        if (cliente.email) console.log(`Email: ${cliente.email}`);
        if (cliente.telefone) console.log(`Telefone: ${cliente.telefone}`);
        console.log(`Cadastro: ${new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}`);
        console.log('-'.repeat(40));
    });
}

// MENU PRINCIPAL
async function mostrarMenuPrincipal() {
    console.clear();
    console.log('======= SISTEMA INTEGRADO DE CLIENTES =======');
    console.log('');
    console.log('OPCOES DE SISTEMA:');
    console.log('1 - Sistema JSON (Arquivos Locais)');
    console.log('2 - Sistema MongoDB (Banco de Dados)');
    console.log('3 - Conectar MongoDB');
    console.log('4 - Estatisticas MongoDB');
    console.log('0 - Sair');
    console.log('='.repeat(50));

    const opcao = await perguntar('\n>>> Escolha uma opcao: ');
    return opcao.trim();
}

async function menuJSON() {
    while (true) {
        console.clear();
        console.log('======= SISTEMA JSON =======');
        console.log('1 - Adicionar Cliente');
        console.log('2 - Listar Clientes');
        console.log('3 - Voltar ao Menu Principal');
        console.log('='.repeat(30));

        const opcao = await perguntar('\n>>> Escolha uma opcao: ');

        switch (opcao.trim()) {
            case '1':
                const nome = await perguntar('Nome: ');
                const cpf = await perguntar('CPF (xxx.xxx.xxx-xx): ');
                const email = await perguntar('Email (opcional): ');
                const telefone = await perguntar('Telefone (opcional): ');
                adicionarClienteJSON(nome, cpf, email, telefone);
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '2':
                listarClientesJSON();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '3':
                return;

            default:
                console.log('ERRO: Opcao invalida!');
                await perguntar('Pressione Enter para continuar...');
        }
    }
}

async function menuMongoDB() {
    try {
        await conectarMongoDB();
        
        while (true) {
            console.clear();
            console.log('======= SISTEMA MONGODB =======');
            console.log('1 - Adicionar Cliente');
            console.log('2 - Listar Clientes');
            console.log('3 - Buscar Cliente por CPF');
            console.log('4 - Atualizar Cliente');
            console.log('5 - Remover Cliente');
            console.log('6 - Voltar ao Menu Principal');
            console.log('='.repeat(35));

            const opcao = await perguntar('\n>>> Escolha uma opcao: ');

            switch (opcao.trim()) {
                case '1':
                    const nome = await perguntar('Nome: ');
                    const cpf = await perguntar('CPF (xxx.xxx.xxx-xx): ');
                    const email = await perguntar('Email: ');
                    const telefone = await perguntar('Telefone: ');
                    const cidade = await perguntar('Cidade: ');
                    
                    await adicionarClienteMongoDB({
                        nome, cpf, email, telefone,
                        endereco: { cidade }
                    });
                    await perguntar('\nPressione Enter para continuar...');
                    break;

                case '2':
                    await listarClientesMongoDB();
                    await perguntar('\nPressione Enter para continuar...');
                    break;

                case '3':
                    const cpfBusca = await perguntar('CPF para buscar: ');
                    await buscarClienteMongoDB(cpfBusca);
                    await perguntar('\nPressione Enter para continuar...');
                    break;

                case '4':
                    const cpfAtualizar = await perguntar('CPF do cliente para atualizar: ');
                    const novoNome = await perguntar('Novo nome (deixe vazio para manter): ');
                    const novoEmail = await perguntar('Novo email (deixe vazio para manter): ');
                    
                    const novosDados = {};
                    if (novoNome.trim()) novosDados.nome = novoNome.trim();
                    if (novoEmail.trim()) novosDados.email = novoEmail.trim();
                    
                    await atualizarClienteMongoDB(cpfAtualizar, novosDados);
                    await perguntar('\nPressione Enter para continuar...');
                    break;

                case '5':
                    const cpfRemover = await perguntar('CPF do cliente para remover: ');
                    await removerClienteMongoDB(cpfRemover);
                    await perguntar('\nPressione Enter para continuar...');
                    break;

                case '6':
                    return;

                default:
                    console.log('ERRO: Opcao invalida!');
                    await perguntar('Pressione Enter para continuar...');
            }
        }
    } catch (error) {
        console.error('ERRO ao conectar MongoDB:', error.message);
        await perguntar('Pressione Enter para continuar...');
    }
}

async function executarSistema() {
    console.log('Iniciando Sistema Integrado de Clientes...\n');

    while (true) {
        const opcao = await mostrarMenuPrincipal();

        switch (opcao) {
            case '1':
                await menuJSON();
                break;

            case '2':
                await menuMongoDB();
                break;

            case '3':
                console.log('Conectando ao MongoDB...');
                try {
                    await conectarMongoDB();
                    console.log('\nMongoDB conectado com sucesso!');
                    console.log('Conecte no Compass: mongodb://localhost:27017');
                    console.log('Banco: meubanco');
                } catch (error) {
                    console.error('ERRO:', error.message);
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '4':
                try {
                    await conectarMongoDB();
                    const clientes = await listarClientesMongoDB();
                    console.log(`Total de clientes no MongoDB: ${clientes ? clientes.length : 0}`);
                } catch (error) {
                    console.error('ERRO:', error.message);
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '0':
                console.log('Encerrando sistema...');
                rl.close();
                process.exit(0);
                break;

            default:
                console.log('ERRO: Opcao invalida!');
                await perguntar('Pressione Enter para continuar...');
        }
    }
}

// EXPORTACOES E EXECUCAO
module.exports = {
    // JSON System
    carregarClientes,
    salvarClientes,
    adicionarClienteJSON,
    listarClientesJSON,
    
    // MongoDB Integration
    conectarMongoDB,
    adicionarClienteMongoDB,
    listarClientesMongoDB,
    buscarClienteMongoDB,
    atualizarClienteMongoDB,
    removerClienteMongoDB,
    
    // Utils
    validarCPF,
    executarSistema
};

// Execucao principal se chamado diretamente
if (require.main === module) {
    executarSistema().catch(console.error);
}

