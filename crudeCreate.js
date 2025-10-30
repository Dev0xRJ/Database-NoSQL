const mongoose = require('mongoose');

const conectarBanco = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/meubanco');
        console.log('Conectado ao MongoDB com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

const clientesSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: [true, 'O nome e obrigatorio'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'O email e obrigatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email deve ter formato valido']
    },
    cpf: {
        type: String,
        required: [true, 'O CPF e obrigatorio'],
        unique: true,
        match: [/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/, 'O CPF deve estar no formato XXX.XXX.XXX-XX'],
    },
    data_nascimento: {
        type: Date,
        required: [true, 'A data de nascimento e obrigatoria']
    },
    data_cadastro: {
        type: Date,
        default: Date.now,
    }
});

const Cliente = mongoose.model('Cliente', clientesSchema);
async function adicionarCliente(nome, email, cpf, data_nascimento) {
    try {
        const novoCliente = new Cliente({ 
            nome, 
            email, 
            cpf, 
            data_nascimento: new Date(data_nascimento)
        });
        await novoCliente.save();
        console.log('Cliente adicionado com sucesso:', novoCliente);
        return novoCliente;
    } catch (error) {
        if (error.code === 11000) {
            if (error.keyPattern.cpf) {
                console.error('Erro: CPF ja cadastrado.');
            } else if (error.keyPattern.email) {
                console.error('Erro: Email ja cadastrado.');
            } else {
                console.error('Erro: Dados ja cadastrados.');
            }
        } else if (error.name === 'ValidationError') {
            console.error('Erro de validacao:', error.message);
        } else {
            console.error('Erro ao adicionar cliente:', error.message);
        }
        throw error;
    }
}

// Sistema de Menu Interativo
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(pergunta) {
    return new Promise((resolve) => {
        rl.question(pergunta, (resposta) => {
            resolve(resposta);
        });
    });
}

async function mostrarMenu() {
    console.log('\n=== SISTEMA DE CLIENTES MONGODB ===');
    console.log('1. Adicionar Cliente');
    console.log('2. Listar Todos os Clientes');
    console.log('3. Buscar Cliente por CPF');
    console.log('4. Atualizar Cliente');
    console.log('5. Remover Cliente');
    console.log('6. Adicionar Clientes de Exemplo');
    console.log('0. Sair');
    
    const opcao = await perguntar('\n?? Escolha uma op??o: ');
    return opcao;
}

async function menuInterativo() {
    let continuar = true;
    
    while (continuar) {
        const opcao = await mostrarMenu();
        
        switch (opcao) {
            case '1':
                console.log('\n--- ADICIONAR CLIENTE ---');
                const nome = await perguntar('Nome: ');
                const email = await perguntar('Email: ');
                const cpf = await perguntar('CPF (xxx.xxx.xxx-xx): ');
                const data_nascimento = await perguntar('Data de Nascimento (YYYY-MM-DD): ');
                
                if (nome.trim() && email.trim() && cpf.trim() && data_nascimento.trim()) {
                    await adicionarCliente(nome.trim(), email.trim(), cpf.trim(), data_nascimento.trim());
                } else {
                    console.log('Todos os campos sao obrigatorios!');
                }
                break;
                
            case '2':
                console.log('\n--- LISTA DE CLIENTES ---');
                await buscarClientes();
                break;
                
            case '3':
                console.log('\n--- BUSCAR CLIENTE ---');
                const cpfBusca = await perguntar('CPF para buscar: ');
                if (cpfBusca.trim()) {
                    await buscarClientePorCpf(cpfBusca.trim());
                } else {
                    console.log('? CPF ? obrigat?rio!');
                }
                break;
                
            case '4':
                console.log('\n--- ATUALIZAR CLIENTE ---');
                const cpfAtualizar = await perguntar('CPF do cliente para atualizar: ');
                
                if (cpfAtualizar.trim()) {
                    const clienteExiste = await buscarClientePorCpf(cpfAtualizar.trim());
                    
                    if (clienteExiste) {
                        const novoNome = await perguntar('Novo nome (deixe vazio para manter): ');
                        const novoEmail = await perguntar('Novo email (deixe vazio para manter): ');
                        const novoCpf = await perguntar('Novo CPF (deixe vazio para manter): ');
                        const novaDataNascimento = await perguntar('Nova data de nascimento YYYY-MM-DD (deixe vazio para manter): ');
                        
                        const novosDados = {};
                        if (novoNome.trim()) novosDados.nome = novoNome.trim();
                        if (novoEmail.trim()) novosDados.email = novoEmail.trim();
                        if (novoCpf.trim()) novosDados.cpf = novoCpf.trim();
                        if (novaDataNascimento.trim()) novosDados.data_nascimento = new Date(novaDataNascimento.trim());
                        
                        if (Object.keys(novosDados).length > 0) {
                            await atualizarCliente(cpfAtualizar.trim(), novosDados);
                        } else {
                            console.log('Nenhuma alteracao realizada.');
                        }
                    }
                } else {
                    console.log('CPF e obrigatorio!');
                }
                break;
                
            case '5':
                console.log('\n--- REMOVER CLIENTE ---');
                const cpfRemover = await perguntar('CPF do cliente para remover: ');
                
                if (cpfRemover.trim()) {
                    const confirmar = await perguntar('?? Tem certeza? (s/N): ');
                    
                    if (confirmar.toLowerCase() === 's' || confirmar.toLowerCase() === 'sim') {
                        await removerCliente(cpfRemover.trim());
                    } else {
                        console.log('?? Opera??o cancelada.');
                    }
                } else {
                    console.log('? CPF ? obrigat?rio!');
                }
                break;
                
            case '6':
                console.log('\n--- ADICIONANDO CLIENTES DE EXEMPLO ---');
                await adicionarCliente('Joao Silva', 'joao@email.com', '123.456.789-00', '1990-05-15');
                await adicionarCliente('Maria Oliveira', 'maria@email.com', '987.654.321-00', '1985-12-20');
                await adicionarCliente('Pedro Santos', 'pedro@email.com', '111.222.333-44', '1988-03-10');
                await adicionarCliente('Ana Pereira', 'ana@email.com', '999.888.777-66', '1992-08-25');
                console.log('Clientes de exemplo adicionados!');
                break;
                
            case '0':
                continuar = false;
                console.log('?? Saindo do sistema...');
                break;
                
            default:
                console.log('? Op??o inv?lida! Tente novamente.');
        }
        
        if (continuar) {
            await perguntar('\n?? Pressione Enter para continuar...');
        }
    }
    
    rl.close();
}

async function main() {
    try {
        // Conectar ao banco
        await conectarBanco();
        
        console.log('?? Sistema iniciado com sucesso!');
        
        // Iniciar menu interativo
        await menuInterativo();
        
    } catch (error) {
        console.error('? Erro na execu??o:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('?? Conex?o com o banco de dados encerrada.');
    }
}

// Executar o programa apenas se for chamado diretamente
if (require.main === module) {
    main();
}

// Exportar fun??es para uso em outros arquivos
module.exports = {
    conectarBanco,
    Cliente,
    adicionarCliente,
    buscarClientes,
    buscarClientePorCpf,
    atualizarCliente,
    removerCliente
};

async function buscarClientes() {
    try {
        const clientes = await Cliente.find().sort({ data_cadastro: -1 });
        
        if (clientes.length === 0) {
            console.log('Nenhum cliente encontrado.');
            return [];
        }
        
        console.log('\n=== LISTA DE CLIENTES ===');
        clientes.forEach((cliente, index) => {
            console.log(`${index + 1}. ${cliente.nome}`);
            console.log(`   Email: ${cliente.email || 'Nao informado'}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Nascimento: ${cliente.data_nascimento ? cliente.data_nascimento.toLocaleDateString('pt-BR') : 'Nao informado'}`);
            console.log(`   Cadastrado: ${cliente.data_cadastro.toLocaleDateString('pt-BR')}`);
            console.log('   ---');
        });
        
        return clientes;
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
    }
}

// UPDATE - Atualizar cliente
async function atualizarCliente(cpf, novosDados) {
    try {
        const cliente = await Cliente.findOneAndUpdate(
            { cpf },
            novosDados,
            { new: true, runValidators: true }
        );
        
        if (cliente) {
            console.log('Cliente atualizado:');
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   Email: ${cliente.email || 'Nao informado'}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Nascimento: ${cliente.data_nascimento ? cliente.data_nascimento.toLocaleDateString('pt-BR') : 'Nao informado'}`);
            console.log(`   Cadastrado: ${cliente.data_cadastro.toLocaleDateString('pt-BR')}`);
            return cliente;
        } else {
            console.log('Cliente nao encontrado.');
            return null;
        }
    } catch (error) {
        if (error.code === 11000) {
            console.error('? Erro: CPF j? existe.');
        } else if (error.name === 'ValidationError') {
            console.error('? Erro de valida??o:', error.message);
        } else {
            console.error('? Erro ao atualizar cliente:', error.message);
        }
        return null;
    }
}

// DELETE - Remover cliente
async function removerCliente(cpf) {
    try {
        const cliente = await Cliente.findOneAndDelete({ cpf });
        
        if (cliente) {
            console.log('Cliente removido:', cliente.nome);
            return cliente;
        } else {
            console.log('Cliente nao encontrado.');
            return null;
        }
    } catch (error) {
        console.error('? Erro ao remover cliente:', error.message);
        return null;
    }
}

// READ - Buscar cliente espec?fico
async function buscarClientePorCpf(cpf) {
    try {
        const cliente = await Cliente.findOne({ cpf });
        if (cliente) {
            console.log('Cliente encontrado:');
            console.log(`   Nome: ${cliente.nome}`);
            console.log(`   Email: ${cliente.email || 'Nao informado'}`);
            console.log(`   CPF: ${cliente.cpf}`);
            console.log(`   Nascimento: ${cliente.data_nascimento ? cliente.data_nascimento.toLocaleDateString('pt-BR') : 'Nao informado'}`);
            console.log(`   Cadastrado: ${cliente.data_cadastro.toLocaleDateString('pt-BR')}`);
        } else {
            console.log('Cliente nao encontrado.');
        }
        return cliente;
    } catch (error) {
        console.error('? Erro ao buscar cliente:', error.message);
        return null;
    }
}
