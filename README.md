# Sistema de Banco de Dados NoSQL

Sistema completo de gerenciamento de clientes usando MongoDB e JSON, desenvolvido em Node.js.

## Funcionalidades

### **Múltiplos Sistemas Integrados**
- **Sistema JSON** - Armazenamento em arquivos locais
- **Sistema MongoDB** - Banco de dados NoSQL
- **Sistema Integrado** - Menu unificado JSON + MongoDB
- **Sistema de Updates** - Especializado em atualizaçoes

### **Campos do Cliente**
- Nome (obrigatório)
- Email (obrigatório, ínico)
- CPF (obrigatório, ínico, formato validado)
- Data de Nascimento (obrigatório)
- Data de Cadastro (automática)

### **Operaçoes CRUD Completas**
-  **CREATE** - Adicionar clientes
-  **READ** - Listar e buscar clientes
-  **UPDATE** - Atualizar dados dos clientes
-  **DELETE** - Remover clientes

##  Instalação e Execução

### **Pré-requisitos**
- Node.js (v14+)
- MongoDB (local ou remoto)
- NPM ou Yarn

### **Instalação**
```bash
# Clone o repositório
git clone https://github.com/Dev0xRJ/Database-NoSQL.git

# Entre no diretório
cd Database-NoSQL

# Instale as dependências
npm install
```

### **Execução**
```bash
# Sistema Integrado (Menu Principal)
npm start

# Sistema MongoDB
npm run mongo

# Sistema JSON
npm run json

# Sistema de Updates
npm run update
```

## Estrutura do Projeto

```
index.js           # Sistema integrado principal
cliente.js         # Sistema JSON completo
crudeCreate.js     # Sistema MongoDB básico
crudUpdate.js      # Sistema especializado em updates
package.json       # Configurações e dependências
dados/
clientes.json  # Armazenamento JSON
README.md          # Documentação
```

## Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **Readline** - Interface de linha de comando
- **JSON** - Armazenamento de dados local

## Exemplos de Uso

### **Sistema MongoDB**
```bash
npm run mongo
# Escolha: 6 (Adicionar exemplos)
# Escolha: 2 (Listar clientes)
```

### **Sistema JSON**
```bash
npm run json
# Use o menu interativo para CRUD
```

### **Sistema Integrado**
```bash
npm start
# Escolha entre JSON ou MongoDB
```

## Validações Implementadas

-  **CPF** - Formato XXX.XXX.XXX-XX e algoritmo oficial
-  **Email** - Formato válido e unicidade
-  **Data** - Formato YYYY-MM-DD
-  **Campos obrigatórios** - Validação completa

## Configuração do MongoDB

O sistema conecta automaticamente em:
```
mongodb://localhost:27017/meubanco
```

Para usar um MongoDB diferente, edite a conexção em `crudeCreate.js`.

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença ISC.

## Autor

**Dev0xRJ**
- GitHub: [@Dev0xRJ](https://github.com/Dev0xRJ)

---

? Se este projeto te ajudou, deixe uma estrela!
