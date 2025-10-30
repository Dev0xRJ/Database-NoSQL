const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const readline = require('readline');

// CONFIGURACOES
const DB_FILE = path.join(__dirname, 'dados', 'clientes.json');
const BACKUP_DIR = path.join(__dirname, 'dados', 'backup');
const MONGODB_URI = 'mongodb://localhost:27017/sistemaclientesdelete';

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
    },
    data_exclusao: {
        type: Date
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
// FUNCOES DE BACKUP
// =============================================

function criarBackupJSON() {
    try {
        // Criar diretorio de backup se nao existir
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        
        // Ler dados atuais
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        
        // Criar nome do arquivo de backup com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `clientes-backup-${timestamp}.json`);
        
        // Salvar backup
        fs.writeFileSync(backupFile, data, 'utf-8');
        
        console.log(`Backup criado: ${backupFile}`);
        return backupFile;
    } catch (error) {
        console.error('ERRO ao criar backup:', error);
        return null;
    }
}

function listarBackups() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            console.log('Nenhum backup encontrado.');
            return [];
        }
        
        const arquivos = fs.readdirSync(BACKUP_DIR)
            .filter(arquivo => arquivo.startsWith('clientes-backup-') && arquivo.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a)); // Mais recente primeiro
        
        if (arquivos.length === 0) {
            console.log('Nenhum backup encontrado.');
            return [];
        }
        
        console.log('\n=== BACKUPS DISPONIVEIS ===');
        arquivos.forEach((arquivo, index) => {
            const caminho = path.join(BACKUP_DIR, arquivo);
            const stats = fs.statSync(caminho);
            console.log(`${index + 1}. ${arquivo}`);
            console.log(`   Data: ${stats.mtime.toLocaleString('pt-BR')}`);
            console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log('-'.repeat(40));
        });
        
        return arquivos;
    } catch (error) {
        console.error('ERRO ao listar backups:', error);
        return [];
    }
}

// =============================================
// FUNCOES DE EXCLUSAO JSON
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
        console.log('Dados salvos no JSON com sucesso!');
        return true;
    } catch (error) {
        console.error('ERRO ao salvar dados:', error);
        return false;
    }
}

function removerClienteJSONPorCPF(cpf, criarBackup = true) {
    try {
        // Criar backup antes da exclusao
        if (criarBackup) {
            console.log('Criando backup antes da exclusao...');
            criarBackupJSON();
        }
        
        const clientes = carregarClientesJSON();
        const cpfFormatado = formatarCPF(cpf);
        const indiceCliente = clientes.findIndex(c => c.cpf === cpfFormatado);
        
        if (indiceCliente === -1) {
            console.log('Cliente nao encontrado no sistema JSON.');
            return false;
        }
        
        const clienteRemovido = clientes[indiceCliente];
        clientes.splice(indiceCliente, 1);
        
        if (salvarClientesJSON(clientes)) {
            console.log('\n=== CLIENTE REMOVIDO (JSON) ===');
            console.log(`Nome: ${clienteRemovido.nome}`);
            console.log(`CPF: ${clienteRemovido.cpf}`);
            console.log(`Email: ${clienteRemovido.email || 'Nao informado'}`);
            console.log('Cliente removido com sucesso!');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('ERRO ao remover cliente JSON:', error);
        return false;
    }
}

function removerClienteJSONPorID(id, criarBackup = true) {
    try {
        // Criar backup antes da exclusao
        if (criarBackup) {
            console.log('Criando backup antes da exclusao...');
            criarBackupJSON();
        }
        
        const clientes = carregarClientesJSON();
        const indiceCliente = clientes.findIndex(c => c.id === parseInt(id));
        
        if (indiceCliente === -1) {
            console.log('Cliente nao encontrado no sistema JSON.');
            return false;
        }
        
        const clienteRemovido = clientes[indiceCliente];
        clientes.splice(indiceCliente, 1);
        
        if (salvarClientesJSON(clientes)) {
            console.log('\n=== CLIENTE REMOVIDO (JSON) ===');
            console.log(`ID: ${clienteRemovido.id}`);
            console.log(`Nome: ${clienteRemovido.nome}`);
            console.log(`CPF: ${clienteRemovido.cpf}`);
            console.log('Cliente removido com sucesso!');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('ERRO ao remover cliente JSON:', error);
        return false;
    }
}

function removerTodosClientesJSON(confirmar = false) {
    try {
        if (!confirmar) {
            console.log('OPERACAO CANCELADA: Confirmacao necessaria!');
            return false;
        }
        
        console.log('Criando backup antes da exclusao completa...');
        criarBackupJSON();
        
        const clientesRemovidos = carregarClientesJSON().length;
        
        if (salvarClientesJSON([])) {
            console.log(`\n=== TODOS OS CLIENTES REMOVIDOS (JSON) ===`);
            console.log(`Total removido: ${clientesRemovidos} cliente(s)`);
            console.log('Operacao concluida com sucesso!');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('ERRO ao remover todos os clientes:', error);
        return false;
    }
}

// =============================================
// FUNCOES DE EXCLUSAO MONGODB
// =============================================

async function removerClienteMongoDBPorCPF(cpf, exclusaoLogica = true) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        
        let resultado;
        if (exclusaoLogica) {
            // Exclusao logica - apenas marca como inativo e define data de exclusao
            resultado = await Cliente.findOneAndUpdate(
                { cpf: cpfFormatado, ativo: true },
                { 
                    ativo: false, 
                    data_exclusao: new Date(),
                    data_atualizacao: new Date()
                },
                { new: true }
            );
            
            if (resultado) {
                console.log('\n=== CLIENTE DESATIVADO (MONGODB) ===');
                console.log(`Nome: ${resultado.nome}`);
                console.log(`CPF: ${resultado.cpf}`);
                console.log(`Status: Inativo`);
                console.log(`Data de exclusao: ${resultado.data_exclusao.toLocaleString('pt-BR')}`);
                console.log('Cliente desativado com sucesso!');
                return true;
            }
        } else {
            // Exclusao fisica - remove permanentemente
            resultado = await Cliente.findOneAndDelete({ cpf: cpfFormatado });
            
            if (resultado) {
                console.log('\n=== CLIENTE REMOVIDO PERMANENTEMENTE (MONGODB) ===');
                console.log(`Nome: ${resultado.nome}`);
                console.log(`CPF: ${resultado.cpf}`);
                console.log('Cliente removido permanentemente!');
                return true;
            }
        }
        
        console.log('Cliente nao encontrado ou ja removido.');
        return false;
        
    } catch (error) {
        console.error('ERRO ao remover cliente MongoDB:', error.message);
        return false;
    }
}

async function removerClienteMongoDBPorID(id, exclusaoLogica = true) {
    try {
        let resultado;
        if (exclusaoLogica) {
            resultado = await Cliente.findByIdAndUpdate(
                id,
                { 
                    ativo: false, 
                    data_exclusao: new Date(),
                    data_atualizacao: new Date()
                },
                { new: true }
            );
        } else {
            resultado = await Cliente.findByIdAndDelete(id);
        }
        
        if (resultado) {
            const acao = exclusaoLogica ? 'desativado' : 'removido permanentemente';
            console.log(`\n=== CLIENTE ${acao.toUpperCase()} (MONGODB) ===`);
            console.log(`ID: ${resultado._id}`);
            console.log(`Nome: ${resultado.nome}`);
            console.log(`CPF: ${resultado.cpf}`);
            console.log(`Cliente ${acao}!`);
            return true;
        }
        
        console.log('Cliente nao encontrado.');
        return false;
        
    } catch (error) {
        console.error('ERRO ao remover cliente MongoDB:', error.message);
        return false;
    }
}

async function reativarClienteMongoDB(cpf) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        
        const resultado = await Cliente.findOneAndUpdate(
            { cpf: cpfFormatado, ativo: false },
            { 
                ativo: true, 
                $unset: { data_exclusao: "" },
                data_atualizacao: new Date()
            },
            { new: true }
        );
        
        if (resultado) {
            console.log('\n=== CLIENTE REATIVADO (MONGODB) ===');
            console.log(`Nome: ${resultado.nome}`);
            console.log(`CPF: ${resultado.cpf}`);
            console.log(`Status: Ativo`);
            console.log('Cliente reativado com sucesso!');
            return true;
        }
        
        console.log('Cliente nao encontrado ou ja esta ativo.');
        return false;
        
    } catch (error) {
        console.error('ERRO ao reativar cliente:', error.message);
        return false;
    }
}

async function listarClientesInativos() {
    try {
        const clientes = await Cliente.find({ ativo: false }).sort({ data_exclusao: -1 });
        
        if (clientes.length === 0) {
            console.log('Nenhum cliente inativo encontrado.');
            return [];
        }
        
        console.log(`\n=== ${clientes.length} CLIENTE(S) INATIVO(S) ===`);
        clientes.forEach((cliente, index) => {
            console.log(`${index + 1}. Nome: ${cliente.nome}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Email: ${cliente.email || 'Nao informado'}`);
            if (cliente.data_exclusao) {
                console.log(`   Desativado em: ${cliente.data_exclusao.toLocaleString('pt-BR')}`);
            }
            console.log('-'.repeat(40));
        });
        
        return clientes;
    } catch (error) {
        console.error('ERRO ao listar clientes inativos:', error.message);
        return [];
    }
}

async function removerClientesInativosPermanentemente(diasInativos = 30) {
    try {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - diasInativos);
        
        const resultado = await Cliente.deleteMany({
            ativo: false,
            data_exclusao: { $lt: dataLimite }
        });
        
        console.log(`\n=== LIMPEZA DE CLIENTES INATIVOS ===`);
        console.log(`Clientes removidos permanentemente: ${resultado.deletedCount}`);
        console.log(`Criterio: Inativos ha mais de ${diasInativos} dias`);
        
        return resultado.deletedCount;
    } catch (error) {
        console.error('ERRO ao remover clientes inativos permanentemente:', error.message);
        return 0;
    }
}

// =============================================
// MENU INTERATIVO
// =============================================

async function mostrarMenuPrincipal() {
    console.clear();
    console.log('======= SISTEMA DE EXCLUSAO DE CLIENTES =======');
    console.log('');
    console.log('OPCOES DE EXCLUSAO JSON:');
    console.log('1 - Remover Cliente JSON (por CPF)');
    console.log('2 - Remover Cliente JSON (por ID)');
    console.log('3 - Remover TODOS os Clientes JSON');
    console.log('4 - Listar Backups JSON');
    console.log('');
    console.log('OPCOES DE EXCLUSAO MONGODB:');
    console.log('5 - Desativar Cliente MongoDB (Exclusao Logica)');
    console.log('6 - Remover Cliente MongoDB (Exclusao Fisica)');
    console.log('7 - Reativar Cliente MongoDB');
    console.log('8 - Listar Clientes Inativos');
    console.log('9 - Limpeza de Clientes Inativos');
    console.log('');
    console.log('0 - Sair');
    console.log('='.repeat(50));

    const opcao = await perguntar('\n>>> Escolha uma opcao: ');
    return opcao.trim();
}

async function executarSistema() {
    console.log('Iniciando Sistema de Exclusao de Clientes...\n');

    while (true) {
        const opcao = await mostrarMenuPrincipal();

        switch (opcao) {
            case '1':
                const cpfJSON = await perguntar('Digite o CPF do cliente: ');
                if (cpfJSON.trim()) {
                    const confirmar = await perguntar('Confirma a remocao? (s/N): ');
                    if (confirmar.toLowerCase() === 's') {
                        removerClienteJSONPorCPF(cpfJSON);
                    } else {
                        console.log('Operacao cancelada.');
                    }
                } else {
                    console.log('CPF e obrigatorio!');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '2':
                const idJSON = await perguntar('Digite o ID do cliente: ');
                if (idJSON.trim()) {
                    const confirmar = await perguntar('Confirma a remocao? (s/N): ');
                    if (confirmar.toLowerCase() === 's') {
                        removerClienteJSONPorID(idJSON);
                    } else {
                        console.log('Operacao cancelada.');
                    }
                } else {
                    console.log('ID e obrigatorio!');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '3':
                console.log('ATENCAO: Esta operacao removera TODOS os clientes do JSON!');
                const confirmarTodos = await perguntar('Digite "CONFIRMAR" para prosseguir: ');
                if (confirmarTodos === 'CONFIRMAR') {
                    removerTodosClientesJSON(true);
                } else {
                    console.log('Operacao cancelada.');
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '4':
                listarBackups();
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '5':
                const conectado1 = await conectarMongoDB();
                if (conectado1) {
                    const cpfMongo1 = await perguntar('Digite o CPF do cliente: ');
                    if (cpfMongo1.trim()) {
                        const confirmar = await perguntar('Confirma a desativacao? (s/N): ');
                        if (confirmar.toLowerCase() === 's') {
                            await removerClienteMongoDBPorCPF(cpfMongo1, true);
                        } else {
                            console.log('Operacao cancelada.');
                        }
                    } else {
                        console.log('CPF e obrigatorio!');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '6':
                const conectado2 = await conectarMongoDB();
                if (conectado2) {
                    const cpfMongo2 = await perguntar('Digite o CPF do cliente: ');
                    if (cpfMongo2.trim()) {
                        console.log('ATENCAO: Esta e uma exclusao PERMANENTE!');
                        const confirmar = await perguntar('Digite "CONFIRMAR" para prosseguir: ');
                        if (confirmar === 'CONFIRMAR') {
                            await removerClienteMongoDBPorCPF(cpfMongo2, false);
                        } else {
                            console.log('Operacao cancelada.');
                        }
                    } else {
                        console.log('CPF e obrigatorio!');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '7':
                const conectado3 = await conectarMongoDB();
                if (conectado3) {
                    const cpfReativar = await perguntar('Digite o CPF do cliente para reativar: ');
                    if (cpfReativar.trim()) {
                        await reativarClienteMongoDB(cpfReativar);
                    } else {
                        console.log('CPF e obrigatorio!');
                    }
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '8':
                const conectado4 = await conectarMongoDB();
                if (conectado4) {
                    await listarClientesInativos();
                }
                await perguntar('\nPressione Enter para continuar...');
                break;

            case '9':
                const conectado5 = await conectarMongoDB();
                if (conectado5) {
                    const dias = await perguntar('Remover clientes inativos ha quantos dias? (padrao: 30): ');
                    const diasNumero = parseInt(dias) || 30;
                    
                    console.log(`ATENCAO: Serao removidos permanentemente clientes inativos ha mais de ${diasNumero} dias!`);
                    const confirmar = await perguntar('Digite "CONFIRMAR" para prosseguir: ');
                    if (confirmar === 'CONFIRMAR') {
                        await removerClientesInativosPermanentemente(diasNumero);
                    } else {
                        console.log('Operacao cancelada.');
                    }
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
    removerClienteJSONPorCPF,
    removerClienteJSONPorID,
    removerTodosClientesJSON,
    
    // MongoDB Functions
    conectarMongoDB,
    removerClienteMongoDBPorCPF,
    removerClienteMongoDBPorID,
    reativarClienteMongoDB,
    listarClientesInativos,
    removerClientesInativosPermanentemente,
    
    // Backup Functions
    criarBackupJSON,
    listarBackups,
    
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