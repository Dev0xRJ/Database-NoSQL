# ??? Sistema de Banco de Dados NoSQL

Sistema completo de gerenciamento de clientes usando MongoDB e JSON, desenvolvido em Node.js.

## ?? Funcionalidades

### ?? **M?ltiplos Sistemas Integrados**
- **Sistema JSON** - Armazenamento em arquivos locais
- **Sistema MongoDB** - Banco de dados NoSQL
- **Sistema Integrado** - Menu unificado JSON + MongoDB
- **Sistema de Updates** - Especializado em atualiza??es

### ?? **Campos do Cliente**
- Nome (obrigat?rio)
- Email (obrigat?rio, ?nico)
- CPF (obrigat?rio, ?nico, formato validado)
- Data de Nascimento (obrigat?rio)
- Data de Cadastro (autom?tica)

### ? **Opera??es CRUD Completas**
- ? **CREATE** - Adicionar clientes
- ? **READ** - Listar e buscar clientes
- ? **UPDATE** - Atualizar dados dos clientes
- ? **DELETE** - Remover clientes

## ?? Instala??o e Execu??o

### **Pr?-requisitos**
- Node.js (v14+)
- MongoDB (local ou remoto)
- NPM ou Yarn

### **Instala??o**
```bash
# Clone o reposit?rio
git clone https://github.com/Dev0xRJ/Database-NoSQL.git

# Entre no diret?rio
cd Database-NoSQL

# Instale as depend?ncias
npm install
```

### **Execu??o**
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

## ?? Estrutura do Projeto

```
??? index.js           # Sistema integrado principal
??? cliente.js         # Sistema JSON completo
??? crudeCreate.js     # Sistema MongoDB b?sico
??? crudUpdate.js      # Sistema especializado em updates
??? package.json       # Configura??es e depend?ncias
??? dados/
?   ??? clientes.json  # Armazenamento JSON
??? README.md          # Documenta??o
```

## ??? Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **Readline** - Interface de linha de comando
- **JSON** - Armazenamento de dados local

## ?? Exemplos de Uso

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

## ?? Valida??es Implementadas

- ? **CPF** - Formato XXX.XXX.XXX-XX e algoritmo oficial
- ? **Email** - Formato v?lido e unicidade
- ? **Data** - Formato YYYY-MM-DD
- ? **Campos obrigat?rios** - Valida??o completa

## ?? Configura??o do MongoDB

O sistema conecta automaticamente em:
```
mongodb://localhost:27017/meubanco
```

Para usar um MongoDB diferente, edite a conex?o em `crudeCreate.js`.

## ?? Contribui??o

1. Fa?a um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudan?as (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## ?? Licen?a

Este projeto est? sob a licen?a ISC.

## ????? Autor

**Dev0xRJ**
- GitHub: [@Dev0xRJ](https://github.com/Dev0xRJ)

---

? Se este projeto te ajudou, deixe uma estrela!