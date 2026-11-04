# 🌸 Site de Confirmação de Presença (RSVP) — Tema Flores Coloridas

Site completo de confirmação de presença para festa de aniversário feminino, em português do Brasil, com identidade visual **"Jardim de Flores Coloridas"**, contagem regressiva, chuva de pétalas animada, integração com Google Calendar / `.ics` e **Painel da Anfitriã (`/admin`)** com exportação para Excel (`.xlsx` e `.csv`) e botão direto para WhatsApp.

---

## 💡 Por que escolhemos a Opção A (Node.js + Express + SQLite)?

Escolhemos a **Opção A (Node.js + Express com banco de dados SQLite)** porque:
1. **Funciona imediatamente sem configurações externas:** Você não precisa criar conta no Google Cloud, nem configurar permissões de scripts ou publicar Web Apps no Google Apps Script. Basta rodar `npm install` e `npm start` que o banco de dados `database.sqlite` é criado sozinho na mesma pasta!
2. **Controle total e rápido no Painel `/admin`:** Permite excluir respostas indesejadas com um clique, atualizar automaticamente quando um convidado envia o mesmo telefone (evitando duplicados) e gerar arquivos `.xlsx` (Excel nativo) e `.csv` instantaneamente.
3. **100% gratuito:** Não depende de serviços pagos nem tem limites de requisições por minuto.

---

## 📁 Estrutura de Arquivos

```text
📦 Presença
 ┣ 📂 public
 ┃ ┣ 📂 css
 ┃ ┃ ┗ 📜 style.css      # Estilos do tema Flores Coloridas, animações e responsividade
 ┃ ┣ 📂 js
 ┃ ┃ ┣ 📜 app.js         # Lógica da página do convidado (máscara, validação, pétalas, agenda)
 ┃ ┃ ┗ 📜 admin.js       # Lógica do painel da anfitriã (filtros, busca, WhatsApp, exportação)
 ┃ ┣ 📜 index.html       # Página do Convidado (Convite + Formulário RSVP)
 ┃ ┗ 📜 admin.html       # Página do Painel da Anfitriã (/admin)
 ┣ 📜 config.js          # ⭐ ARQUIVO PRINCIPAL PARA EDITAR OS DADOS DA FESTA E SENHA
 ┣ 📜 server.js          # Servidor Node.js + Express + Banco SQLite + Exportação Excel
 ┣ 📜 package.json       # Lista de dependências e comandos do projeto
 ┗ 📜 README.md          # Guia passo a passo de uso e publicação
```

---

## ✏️ 1. Como personalizar os dados da sua festa

Abra o arquivo **`config.js`** em qualquer editor de texto (até mesmo no Bloco de Notas) e altere os textos entre aspas:

- **`nomeAniversariante`**: Nome da aniversariante (`[NOME]`)
- **`idade`**: Idade comemorada (`[IDADE]`)
- **`dataHoraTexto`**: Texto da data e hora exibido no convite (`[DATA E HORA]`)
- **`dataHoraISO`**: Data no formato `AAAA-MM-DDTHH:MM:SS-03:00` para o relógio da contagem regressiva
- **`nomeLocal`** e **`enderecoLocal`**: Nome do espaço e endereço (`[LOCAL]`)
- **`observacoes`**: Dress code, dicas e avisos (`[OBSERVAÇÕES]`)
- **`senhaAdmin`**: Senha para abrir o painel `/admin` (padrão: `flores123`)

---

## 💻 2. Como rodar no seu computador (Passo a Passo Simples)

### Pré-requisito
- Ter o **Node.js** instalado no computador (baixe gratuitamente em [https://nodejs.org](https://nodejs.org) — escolha a versão **LTS** e clique em "Avançar" até concluir).

### Passo a passo
1. Abra o **Terminal** (no Windows, procure por **PowerShell** ou **Prompt de Comando**) dentro da pasta do projeto.
2. Instale as dependências (só precisa fazer na primeira vez):
   ```bash
   npm install
   ```
3. Inicie o site:
   ```bash
   npm start
   ```
4. Abra o navegador e acesse:
   - **Página do Convidado:** `http://localhost:3000`
   - **Painel da Anfitriã:** `http://localhost:3000/admin` (Senha padrão: `flores123`)

---

## ☁️ 3. Como publicar gratuitamente na internet (para enviar no WhatsApp)

Como este projeto possui um banco de dados SQLite que salva um arquivo local (`database.sqlite`), a plataforma gratuita mais simples para iniciantes é o **Render.com** ou o **Railway.app** (servidores Node.js completos).

### Passo a passo para publicar grátis no Render.com:
1. Crie uma conta gratuita no [GitHub.com](https://github.com) e crie um novo repositório (ex: `meu-aniversario-rsvp`).
2. Envie os arquivos desta pasta para o seu repositório no GitHub (exceto a pasta `node_modules` e o arquivo `database.sqlite`).
3. Acesse [Render.com](https://render.com) e entre usando sua conta do GitHub.
4. Clique no botão **"New +"** no topo e selecione **"Web Service"**.
5. Conecte o seu repositório `meu-aniversario-rsvp`.
6. Preencha as opções:
   - **Name:** `aniversario-helena` (ou o nome que preferir — fará parte do seu link!)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Escolha a opção **Free** (Gratuito).
7. Clique em **"Create Web Service"**.
8. Em cerca de 2 minutos o Render mostrará o seu link público no topo (ex: `https://aniversario-helena.onrender.com`).
   - Envie esse link para seus convidados no WhatsApp!
   - Para ver as respostas, acesse `https://aniversario-helena.onrender.com/admin`.

> **💡 Dica importante sobre o plano gratuito do Render:** No plano gratuito, se ninguém acessar o site por muitos dias, o servidor pode reiniciar. Por isso, recomendamos clicar no botão **"Baixar Planilha (.xlsx)"** no seu painel `/admin` periodicamente para guardar uma cópia atualizada da sua lista no seu celular ou computador!

