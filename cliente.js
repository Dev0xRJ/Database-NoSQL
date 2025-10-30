const fs = require('fs');
const path = require('path');

// Caminho para o arquivo de dados
const DB_FILE = path.join(__dirname, 'dados', 'clientes.json');

/**
 * Valida??o de CPF usando algoritmo oficial
 * @param {string} cpf - CPF para validar
 * @returns {boolean} - true se v?lido
 */
function validarCPF(cpf) {
    // Remove caracteres n?o num?ricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 d?gitos
    if (cpf.length !== 11) return false;
    
    // Verifica se n?o s?o todos d?gitos iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Valida??o do primeiro d?gito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    // Valida??o do segundo d?gito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

/**
 * Formatar CPF no padr?o XXX.XXX.XXX-XX
 * @param {string} cpf - CPF para formatar
 * @returns {string} - CPF formatado
 */
function formatarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length === 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

/**
 * Carregar clientes do arquivo JSON
 * @returns {Array<Object>} - Lista de clientes
 */
function carregarClientes() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('? Erro ao carregar clientes:', error.message);
        return [];
    }
}

/**
 * Salvar clientes no arquivo JSON
 * @param {Array<Object>} clientes - Lista de clientes para salvar
 */
function salvarClientes(clientes) {
    try {
        const dir = path.dirname(DB_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const data = JSON.stringify(clientes, null, 4);
        fs.writeFileSync(DB_FILE, data, 'utf-8');
        console.log('? Clientes salvos com sucesso!');
    } catch (error) {
        console.error('? Erro ao salvar clientes:', error.message);
    }
}

/**
 * Adicionar um novo cliente
 * @param {string} nome - Nome do cliente
 * @param {string} cpf - CPF do cliente
 * @param {string} email - Email do cliente (opcional)
 * @param {string} telefone - Telefone do cliente (opcional)
 * @returns {boolean} - true se adicionado com sucesso
 */
function adicionarCliente(nome, cpf, email = '', telefone = '') {
    try {
        // Validar dados obrigat?rios
        if (!nome || !nome.trim()) {
            console.error('? Nome ? obrigat?rio!');
            return false;
        }
        
        if (!cpf || !cpf.trim()) {
            console.error('? CPF ? obrigat?rio!');
            return false;
        }
        
        // Validar CPF
        if (!validarCPF(cpf)) {
            console.error('? CPF inv?lido! Use o formato: XXX.XXX.XXX-XX');
            return false;
        }
        
        // Formatar CPF
        const cpfFormatado = formatarCPF(cpf);
        
        // Carregar clientes existentes
        const clientes = carregarClientes();
        
        // Verificar se CPF j? existe
        const clienteExistente = clientes.find(cliente => cliente.cpf === cpfFormatado);
        if (clienteExistente) {
            console.error('? CPF j? cadastrado!');
            return false;
        }
        
        // Validar email se fornecido
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                console.error('? Email inv?lido!');
                return false;
            }
        }
        
        // Criar novo cliente
        const novoCliente = {
            id: clientes.length + 1,
            nome: nome.trim(),
            cpf: cpfFormatado,
            email: email.trim() || null,
            telefone: telefone.trim() || null,
            data_cadastro: new Date().toISOString(),
            ativo: true
        };
        
        // Adicionar ? lista
        clientes.push(novoCliente);
        
        // Salvar no arquivo
        salvarClientes(clientes);
        
        console.log('? Cliente adicionado com sucesso:');
        console.log(`   ID: ${novoCliente.id}`);
        console.log(`   Nome: ${novoCliente.nome}`);
        console.log(`   CPF: ${novoCliente.cpf}`);
        if (novoCliente.email) console.log(`   Email: ${novoCliente.email}`);
        if (novoCliente.telefone) console.log(`   Telefone: ${novoCliente.telefone}`);
        
        return true;
        
    } catch (error) {
        console.error('? Erro ao adicionar cliente:', error.message);
        return false;
    }
}

/**
 * Listar todos os clientes
 */
function listarClientes() {
    const clientes = carregarClientes();
    
    if (clientes.length === 0) {
        console.log('?? Nenhum cliente cadastrado.');
        return;
    }
    
    console.log(`\n?? === LISTA DE CLIENTES (${clientes.length} encontrado${clientes.length > 1 ? 's' : ''}) ===`);
    
    clientes.forEach((cliente, index) => {
        console.log(`\n${index + 1}. ${cliente.nome}`);
        console.log(`   ID: ${cliente.id}`);
        console.log(`   CPF: ${cliente.cpf}`);
        
        if (cliente.email) {
            console.log(`   Email: ${cliente.email}`);
        }
        
        if (cliente.telefone) {
            console.log(`   Telefone: ${cliente.telefone}`);
        }
        
        console.log(`   Cadastrado: ${new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}`);
        console.log(`   Status: ${cliente.ativo ? '? Ativo' : '? Inativo'}`);
    });
    
    console.log('\n' + '='.repeat(50));
}

/**
 * Buscar cliente por CPF
 * @param {string} cpf - CPF do cliente
 * @returns {Object|null} - Cliente encontrado ou null
 */
function buscarClientePorCpf(cpf) {
    if (!cpf || !cpf.trim()) {
        console.error('? CPF ? obrigat?rio para busca!');
        return null;
    }
    
    const cpfFormatado = formatarCPF(cpf);
    const clientes = carregarClientes();
    
    const cliente = clientes.find(c => c.cpf === cpfFormatado);
    
    if (cliente) {
        console.log('\n?? Cliente encontrado:');
        console.log(`   ID: ${cliente.id}`);
        console.log(`   Nome: ${cliente.nome}`);
        console.log(`   CPF: ${cliente.cpf}`);
        if (cliente.email) console.log(`   Email: ${cliente.email}`);
        if (cliente.telefone) console.log(`   Telefone: ${cliente.telefone}`);
        console.log(`   Cadastrado: ${new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}`);
        console.log(`   Status: ${cliente.ativo ? '? Ativo' : '? Inativo'}`);
    } else {
        console.log('? Cliente n?o encontrado.');
    }
    
    return cliente;
}

/**
 * Atualizar dados de um cliente
 * @param {string} cpf - CPF do cliente
 * @param {Object} novosDados - Novos dados do cliente
 * @returns {boolean} - true se atualizado com sucesso
 */
function atualizarCliente(cpf, novosDados) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        const clientes = carregarClientes();
        
        const index = clientes.findIndex(c => c.cpf === cpfFormatado);
        
        if (index === -1) {
            console.log('? Cliente n?o encontrado.');
            return false;
        }
        
        const clienteAtual = clientes[index];
        
        // Atualizar campos se fornecidos
        if (novosDados.nome && novosDados.nome.trim()) {
            clienteAtual.nome = novosDados.nome.trim();
        }
        
        if (novosDados.email !== undefined) {
            if (novosDados.email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(novosDados.email.trim())) {
                    console.error('? Email inv?lido!');
                    return false;
                }
                clienteAtual.email = novosDados.email.trim();
            } else {
                clienteAtual.email = null;
            }
        }
        
        if (novosDados.telefone !== undefined) {
            clienteAtual.telefone = novosDados.telefone.trim() || null;
        }
        
        if (novosDados.ativo !== undefined) {
            clienteAtual.ativo = Boolean(novosDados.ativo);
        }
        
        // Atualizar data de modifica??o
        clienteAtual.data_atualizacao = new Date().toISOString();
        
        // Salvar altera??es
        salvarClientes(clientes);
        
        console.log('? Cliente atualizado com sucesso:');
        console.log(`   Nome: ${clienteAtual.nome}`);
        console.log(`   CPF: ${clienteAtual.cpf}`);
        if (clienteAtual.email) console.log(`   Email: ${clienteAtual.email}`);
        if (clienteAtual.telefone) console.log(`   Telefone: ${clienteAtual.telefone}`);
        
        return true;
        
    } catch (error) {
        console.error('? Erro ao atualizar cliente:', error.message);
        return false;
    }
}

/**
 * Remover um cliente (desativar)
 * @param {string} cpf - CPF do cliente
 * @param {boolean} removerCompletamente - Se true, remove do arquivo, se false apenas desativa
 * @returns {boolean} - true se removido com sucesso
 */
function removerCliente(cpf, removerCompletamente = false) {
    try {
        const cpfFormatado = formatarCPF(cpf);
        const clientes = carregarClientes();
        
        const index = clientes.findIndex(c => c.cpf === cpfFormatado);
        
        if (index === -1) {
            console.log('? Cliente n?o encontrado.');
            return false;
        }
        
        const cliente = clientes[index];
        
        if (removerCompletamente) {
            // Remover completamente do arquivo
            clientes.splice(index, 1);
            console.log(`? Cliente ${cliente.nome} removido completamente do sistema.`);
        } else {
            // Apenas desativar
            cliente.ativo = false;
            cliente.data_desativacao = new Date().toISOString();
            console.log(`? Cliente ${cliente.nome} foi desativado.`);
        }
        
        // Salvar altera??es
        salvarClientes(clientes);
        
        return true;
        
    } catch (error) {
        console.error('? Erro ao remover cliente:', error.message);
        return false;
    }
}

/**
 * Adicionar v?rios clientes de uma vez
 * @param {Array<Object>} listaClientes - Lista de objetos com dados dos clientes
 */
function adicionarVariosClientes(listaClientes) {
    if (!Array.isArray(listaClientes)) {
        console.error('? Lista de clientes deve ser um array!');
        return;
    }
    
    console.log(`?? Processando ${listaClientes.length} cliente(s)...`);
    
    let sucessos = 0;
    let erros = 0;
    
    listaClientes.forEach((cliente, index) => {
        console.log(`\n--- Cliente ${index + 1}/${listaClientes.length} ---`);
        
        if (adicionarCliente(
            cliente.nome,
            cliente.cpf,
            cliente.email || '',
            cliente.telefone || ''
        )) {
            sucessos++;
        } else {
            erros++;
        }
    });
    
    console.log(`\n?? RESULTADO:`);
    console.log(`? ${sucessos} cliente(s) adicionado(s) com sucesso`);
    if (erros > 0) {
        console.log(`? ${erros} cliente(s) com erro`);
    }
}

// Exemplo de clientes para teste
const clientesExemplo = [
    {
        nome: 'Jo?o Silva',
        cpf: '12345678901',
        email: 'joao.silva@email.com',
        telefone: '(11) 99999-1111'
    },
    {
        nome: 'Maria Santos',
        cpf: '98765432100',
        email: 'maria.santos@email.com',
        telefone: '(11) 99999-2222'
    },
    {
        nome: 'Pedro Oliveira',
        cpf: '11122233344',
        email: 'pedro.oliveira@email.com',
        telefone: '(11) 99999-3333'
    },
    {
        nome: 'Ana Costa',
        cpf: '55566677788',
        email: 'ana.costa@email.com',
        telefone: '(11) 99999-4444'
    }
];

/**
 * Menu interativo para o sistema
 */
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
    console.log('\n?? === SISTEMA DE CLIENTES (JSON) ===');
    console.log('1. ?? Adicionar Cliente');
    console.log('2. ?? Listar Todos os Clientes');
    console.log('3. ?? Buscar Cliente por CPF');
    console.log('4. ??  Atualizar Cliente');
    console.log('5. ???  Remover Cliente');
    console.log('6. ?? Adicionar Clientes de Exemplo');
    console.log('7. ?? Estat?sticas');
    console.log('0. ? Sair');
    
    const opcao = await perguntar('\n?? Escolha uma op??o: ');
    return opcao;
}

async function mostrarEstatisticas() {
    const clientes = carregarClientes();
    const ativos = clientes.filter(c => c.ativo).length;
    const inativos = clientes.filter(c => !c.ativo).length;
    const comEmail = clientes.filter(c => c.email).length;
    const comTelefone = clientes.filter(c => c.telefone).length;
    
    console.log('\n?? === ESTAT?STICAS DO SISTEMA ===');
    console.log(`?? Total de clientes: ${clientes.length}`);
    console.log(`? Clientes ativos: ${ativos}`);
    console.log(`? Clientes inativos: ${inativos}`);
    console.log(`?? Com email: ${comEmail}`);
    console.log(`?? Com telefone: ${comTelefone}`);
    console.log(`?? ?ltimo cadastro: ${clientes.length > 0 ? new Date(Math.max(...clientes.map(c => new Date(c.data_cadastro)))).toLocaleDateString('pt-BR') : 'Nenhum'}`);
}

async function menuInterativo() {
    let continuar = true;
    
    console.log('?? Bem-vindo ao Sistema de Clientes!');
    
    while (continuar) {
        const opcao = await mostrarMenu();
        
        switch (opcao) {
            case '1':
                console.log('\n?? === ADICIONAR CLIENTE ===');
                const nome = await perguntar('Nome completo: ');
                const cpf = await perguntar('CPF: ');
                const email = await perguntar('Email (opcional): ');
                const telefone = await perguntar('Telefone (opcional): ');
                
                if (nome.trim() && cpf.trim()) {
                    adicionarCliente(nome, cpf, email, telefone);
                } else {
                    console.log('? Nome e CPF s?o obrigat?rios!');
                }
                break;
                
            case '2':
                listarClientes();
                break;
                
            case '3':
                console.log('\n?? === BUSCAR CLIENTE ===');
                const cpfBusca = await perguntar('CPF para buscar: ');
                if (cpfBusca.trim()) {
                    buscarClientePorCpf(cpfBusca);
                } else {
                    console.log('? CPF ? obrigat?rio!');
                }
                break;
                
            case '4':
                console.log('\n?? === ATUALIZAR CLIENTE ===');
                const cpfAtualizar = await perguntar('CPF do cliente: ');
                
                if (cpfAtualizar.trim()) {
                    const cliente = buscarClientePorCpf(cpfAtualizar);
                    
                    if (cliente) {
                        const novoNome = await perguntar(`Nome atual: ${cliente.nome}. Novo nome (Enter para manter): `);
                        const novoEmail = await perguntar(`Email atual: ${cliente.email || 'N?o informado'}. Novo email (Enter para manter): `);
                        const novoTelefone = await perguntar(`Telefone atual: ${cliente.telefone || 'N?o informado'}. Novo telefone (Enter para manter): `);
                        
                        const novosDados = {};
                        if (novoNome.trim()) novosDados.nome = novoNome;
                        if (novoEmail.trim() || novoEmail === '') novosDados.email = novoEmail;
                        if (novoTelefone.trim() || novoTelefone === '') novosDados.telefone = novoTelefone;
                        
                        if (Object.keys(novosDados).length > 0) {
                            atualizarCliente(cpfAtualizar, novosDados);
                        } else {
                            console.log('?? Nenhuma altera??o realizada.');
                        }
                    }
                } else {
                    console.log('? CPF ? obrigat?rio!');
                }
                break;
                
            case '5':
                console.log('\n??? === REMOVER CLIENTE ===');
                const cpfRemover = await perguntar('CPF do cliente: ');
                
                if (cpfRemover.trim()) {
                    const cliente = buscarClientePorCpf(cpfRemover);
                    
                    if (cliente) {
                        const tipoRemocao = await perguntar('Desativar (D) ou Remover completamente (R)? [D/R]: ');
                        const confirmar = await perguntar('?? Confirma a opera??o? (s/N): ');
                        
                        if (confirmar.toLowerCase() === 's' || confirmar.toLowerCase() === 'sim') {
                            const removerCompletamente = tipoRemocao.toLowerCase() === 'r';
                            removerCliente(cpfRemover, removerCompletamente);
                        } else {
                            console.log('?? Opera??o cancelada.');
                        }
                    }
                } else {
                    console.log('? CPF ? obrigat?rio!');
                }
                break;
                
            case '6':
                console.log('\n?? === ADICIONAR CLIENTES DE EXEMPLO ===');
                const confirmarExemplo = await perguntar('Adicionar 4 clientes de exemplo? (s/N): ');
                
                if (confirmarExemplo.toLowerCase() === 's' || confirmarExemplo.toLowerCase() === 'sim') {
                    adicionarVariosClientes(clientesExemplo);
                } else {
                    console.log('?? Opera??o cancelada.');
                }
                break;
                
            case '7':
                await mostrarEstatisticas();
                break;
                
            case '0':
                continuar = false;
                console.log('?? Obrigado por usar o Sistema de Clientes!');
                break;
                
            default:
                console.log('? Op??o inv?lida! Tente novamente.');
        }
        
        if (continuar) {
            await perguntar('\n?? Pressione Enter para continuar...');
            console.clear();
        }
    }
    
    rl.close();
}

// Executar se chamado diretamente
if (require.main === module) {
    console.clear();
    menuInterativo().catch(error => {
        console.error('? Erro fatal:', error.message);
        process.exit(1);
    });
}

// Exportar fun??es para uso em outros arquivos
module.exports = {
    validarCPF,
    formatarCPF,
    carregarClientes,
    salvarClientes,
    adicionarCliente,
    listarClientes,
    buscarClientePorCpf,
    atualizarCliente,
    removerCliente,
    adicionarVariosClientes,
    clientesExemplo
};