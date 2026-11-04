/**
 * ============================================================================
 * 🌸 SERVIDOR BACKEND - SISTEMA DE CONFIRMAÇÃO DE PRESENÇA (RSVP) 🌸
 * ============================================================================
 * Tecnologias: Node.js + Express + SQLite3 + Google Sheets (Apps Script) + SheetJS (xlsx)
 */

const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const XLSX = require("xlsx");
const CONFIG_FESTA = require("./config");

const app = express();
const PORT = process.env.PORT || 3000;

// Permite receber dados em JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve os arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, "public")));

// ============================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS SQLITE (Sem dados fictícios pré-carregados)
// ============================================================================
const dbPath = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco de dados SQLite:", err.message);
  } else {
    console.log("✅ Banco de dados SQLite conectado com sucesso (database.sqlite).");
  }
});

// Criação automática da tabela de confirmações caso ainda não exista
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS confirmacoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      telefone_limpo TEXT NOT NULL UNIQUE,
      comparecer TEXT NOT NULL,
      qtd_acompanhantes INTEGER NOT NULL DEFAULT 0,
      nomes_acompanhantes TEXT DEFAULT '',
      restricao_alimentar TEXT DEFAULT '',
      mensagem TEXT DEFAULT '',
      data_resposta TEXT NOT NULL
    )
  `);
});

// ============================================================================
// FUNÇÕES AUXILIARES E INTEGRAÇÃO COM GOOGLE SHEETS
// ============================================================================

function obterUrlGoogleSheets() {
  return (process.env.GOOGLE_SHEETS_URL || CONFIG_FESTA.urlGoogleSheets || "").trim();
}

/**
 * Remove tudo que não for número do telefone para evitar duplicidade
 */
function limparTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "");
}

/**
 * Formata a data/hora atual no padrão brasileiro (DD/MM/AAAA HH:MM:SS)
 */
function obterDataHoraBrasil() {
  return new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/**
 * Middleware para proteger as rotas da anfitriã (/api/admin/*)
 */
function autenticarAdmin(req, res, next) {
  const senhaEnviada = req.headers["x-admin-password"] || req.query.senha || req.body.senha;
  const senhaCorreta = process.env.ADMIN_PASSWORD || CONFIG_FESTA.senhaAdmin;

  if (!senhaEnviada || senhaEnviada !== senhaCorreta) {
    return res.status(401).json({
      erro: "Senha incorreta ou não informada. Acesso restrito à anfitriã."
    });
  }
  next();
}

/**
 * Busca todas as confirmações (do Google Sheets se configurado, ou do SQLite local)
 */
async function obterTodasConfirmacoes() {
  const urlSheets = obterUrlGoogleSheets();
  if (urlSheets) {
    try {
      const resposta = await fetch(urlSheets, { redirect: "follow" });
      if (resposta.ok) {
        const dados = await resposta.json();
        if (Array.isArray(dados.respostas)) {
          return dados.respostas;
        }
      }
    } catch (erro) {
      console.error("Aviso: falha ao consultar Google Sheets, usando SQLite local:", erro.message);
    }
  }

  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM confirmacoes ORDER BY id DESC", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// ============================================================================
// ROTAS PÚBLICAS (CONVIDADOS)
// ============================================================================

/**
 * Retorna as informações da festa para o frontend (sem expor a senha de admin)
 */
app.get("/api/config", (req, res) => {
  const { senhaAdmin, urlGoogleSheets, ...dadosPublicos } = CONFIG_FESTA;
  res.json(dadosPublicos);
});

/**
 * Recebe a confirmação de presença (ou atualiza caso o telefone já exista)
 */
app.post("/api/rsvp", async (req, res) => {
  try {
    const {
      nome,
      telefone,
      comparecer,
      qtd_acompanhantes,
      nomes_acompanhantes,
      restricao_alimentar,
      mensagem
    } = req.body;

    // Validações gentis e claras
    const nomeLimpo = String(nome || "").trim();
    if (!nomeLimpo || nomeLimpo.length < 2) {
      return res.status(400).json({
        erro: "Por favor, informe seu nome completo para que possamos identificar você na lista. 🌸"
      });
    }

    const telLimpo = limparTelefone(telefone);
    if (telLimpo.length < 10 || telLimpo.length > 11) {
      return res.status(400).json({
        erro: "Por favor, digite um número de WhatsApp/telefone válido com DDD (ex: (11) 99999-9999). 📱"
      });
    }

    if (comparecer !== "Sim" && comparecer !== "Não") {
      return res.status(400).json({
        erro: "Por favor, selecione se você poderá comparecer à festa (Sim ou Não). 💐"
      });
    }

    // Se a pessoa não vai comparecer, acompanhantes são zerados automaticamente
    let qtdAcomp = comparecer === "Sim" ? parseInt(qtd_acompanhantes, 10) || 0 : 0;
    if (qtdAcomp < 0) qtdAcomp = 0;
    if (qtdAcomp > 5) {
      return res.status(400).json({
        erro: "O limite máximo é de 5 acompanhantes por confirmação. 🌺"
      });
    }

    // Valida nomes dos acompanhantes quando qtdAcomp > 0
    let listaNomesAcomp = "";
    if (comparecer === "Sim" && qtdAcomp > 0) {
      if (Array.isArray(nomes_acompanhantes)) {
        const nomesPreenchidos = nomes_acompanhantes
          .map((n) => String(n || "").trim())
          .filter((n) => n.length > 0);

        if (nomesPreenchidos.length < qtdAcomp) {
          return res.status(400).json({
            erro: `Você indicou ${qtdAcomp} acompanhante(s). Por gentileza, preencha o nome de cada um deles! 🌷`
          });
        }
        listaNomesAcomp = nomesPreenchidos.join(", ");
      } else {
        listaNomesAcomp = String(nomes_acompanhantes || "").trim();
        if (!listaNomesAcomp) {
          return res.status(400).json({
            erro: `Você indicou ${qtdAcomp} acompanhante(s). Por gentileza, informe o nome deles! 🌷`
          });
        }
      }
    }

    const restricaoLimpa = String(restricao_alimentar || "").trim();
    const mensagemLimpa = String(mensagem || "").trim();
    const dataHora = obterDataHoraBrasil();
    const telefoneFormatado = String(telefone || "").trim();

    // 1. Se o Google Sheets estiver configurado, salva direto na planilha online!
    const urlSheets = obterUrlGoogleSheets();
    let atualizadoSheets = null;

    if (urlSheets) {
      try {
        const respSheets = await fetch(urlSheets, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          redirect: "follow",
          body: JSON.stringify({
            acao: "salvar",
            nome: nomeLimpo,
            telefone: telefoneFormatado,
            telefone_limpo: telLimpo,
            comparecer,
            qtd_acompanhantes: qtdAcomp,
            nomes_acompanhantes: listaNomesAcomp,
            mensagem: mensagemLimpa,
            data_resposta: dataHora
          })
        });
        if (respSheets.ok) {
          const jsonSheets = await respSheets.json();
          atualizadoSheets = Boolean(jsonSheets.atualizado);
        }
      } catch (errSheets) {
        console.error("Aviso: erro ao salvar no Google Sheets:", errSheets.message);
      }
    }

    // 2. Salva também no SQLite local
    db.get(
      "SELECT id FROM confirmacoes WHERE telefone_limpo = ?",
      [telLimpo],
      (err, registroExistente) => {
        if (err) {
          console.error("Erro ao consultar telefone:", err);
          return res.status(500).json({
            erro: "Ocorreu um erro ao verificar seus dados. Tente novamente em instantes."
          });
        }

        if (registroExistente) {
          db.run(
            `UPDATE confirmacoes
             SET nome = ?,
                 telefone = ?,
                 comparecer = ?,
                 qtd_acompanhantes = ?,
                 nomes_acompanhantes = ?,
                 restricao_alimentar = ?,
                 mensagem = ?,
                 data_resposta = ?
             WHERE telefone_limpo = ?`,
            [
              nomeLimpo,
              telefoneFormatado,
              comparecer,
              qtdAcomp,
              listaNomesAcomp,
              restricaoLimpa,
              mensagemLimpa,
              dataHora,
              telLimpo
            ],
            function (updateErr) {
              if (updateErr) {
                console.error("Erro ao atualizar confirmação:", updateErr);
                return res.status(500).json({
                  erro: "Não foi possível atualizar sua confirmação. Tente novamente."
                });
              }

              return res.json({
                sucesso: true,
                atualizado: atualizadoSheets !== null ? atualizadoSheets : true,
                comparecer,
                nome: nomeLimpo,
                mensagemRetorno:
                  "Encontramos uma resposta anterior com o seu telefone e atualizamos seus dados com sucesso!"
              });
            }
          );
        } else {
          db.run(
            `INSERT INTO confirmacoes (
              nome, telefone, telefone_limpo, comparecer,
              qtd_acompanhantes, nomes_acompanhantes,
              restricao_alimentar, mensagem, data_resposta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              nomeLimpo,
              telefoneFormatado,
              telLimpo,
              comparecer,
              qtdAcomp,
              listaNomesAcomp,
              restricaoLimpa,
              mensagemLimpa,
              dataHora
            ],
            function (insertErr) {
              if (insertErr) {
                console.error("Erro ao salvar confirmação:", insertErr);
                return res.status(500).json({
                  erro: "Não foi possível registrar sua confirmação. Tente novamente."
                });
              }

              return res.status(201).json({
                sucesso: true,
                atualizado: atualizadoSheets !== null ? atualizadoSheets : false,
                comparecer,
                nome: nomeLimpo,
                mensagemRetorno: "Sua resposta foi registrada com muito carinho!"
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Erro inesperado no RSVP:", error);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// ============================================================================
// ROTAS DO PAINEL DA ANFITRIÃ (/admin)
// ============================================================================

/**
 * Rota para servir a página HTML do painel da anfitriã
 */
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

/**
 * Valida a senha do painel da anfitriã
 */
app.post("/api/admin/login", autenticarAdmin, (req, res) => {
  res.json({ sucesso: true });
});

/**
 * Lista todas as confirmações e calcula os totais do resumo
 */
app.get("/api/admin/rsvps", autenticarAdmin, async (req, res) => {
  try {
    const rows = await obterTodasConfirmacoes();

    let totalConfirmados = 0; // Quantidade de convidados titulares que disseram "Sim"
    let totalRecusas = 0; // Quantidade de convidados titulares que disseram "Não"
    let totalAcompanhantes = 0; // Soma dos acompanhantes de quem vai

    rows.forEach((r) => {
      if (r.comparecer === "Sim") {
        totalConfirmados += 1;
        totalAcompanhantes += Number(r.qtd_acompanhantes || 0);
      } else {
        totalRecusas += 1;
      }
    });

    const totalPessoasConfirmadas = totalConfirmados + totalAcompanhantes;

    res.json({
      resumo: {
        totalRespostas: rows.length,
        totalConfirmados,
        totalRecusas,
        totalAcompanhantes,
        totalPessoasConfirmadas
      },
      respostas: rows
    });
  } catch (err) {
    console.error("Erro ao listar confirmações:", err);
    return res.status(500).json({ erro: "Erro ao buscar respostas." });
  }
});

/**
 * Exclui uma resposta específica pelo ID
 */
app.delete("/api/admin/rsvps/:id", autenticarAdmin, async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ erro: "ID inválido." });
  }

  const urlSheets = obterUrlGoogleSheets();
  if (urlSheets) {
    try {
      await fetch(urlSheets, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify({ acao: "excluir", id })
      });
    } catch (e) {
      console.error("Aviso: erro ao excluir no Google Sheets:", e.message);
    }
  }

  db.run("DELETE FROM confirmacoes WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao excluir registro:", err);
      return res.status(500).json({ erro: "Não foi possível excluir a resposta." });
    }
    res.json({ sucesso: true, excluidos: this.changes });
  });
});

/**
 * Exporta todas as respostas em formato Excel (.xlsx) ou CSV (.csv)
 */
app.get("/api/admin/export/:formato", autenticarAdmin, async (req, res) => {
  const formato = req.params.formato.toLowerCase();

  try {
    const rows = await obterTodasConfirmacoes();

    // Formata as colunas da planilha
    const dadosPlanilha = rows.map((r) => ({
      "Nome": r.nome,
      "Telefone": r.telefone,
      "Status": r.comparecer === "Sim" ? "Confirmado (Sim)" : "Não irá (Não)",
      "Nº de acompanhantes": r.comparecer === "Sim" ? r.qtd_acompanhantes : 0,
      "Nomes dos acompanhantes": r.nomes_acompanhantes || "-",
      "Mensagem": r.mensagem || "-",
      "Data/hora da resposta": r.data_resposta
    }));

    const cabecalhos = [
      "Nome",
      "Telefone",
      "Status",
      "Nº de acompanhantes",
      "Nomes dos acompanhantes",
      "Mensagem",
      "Data/hora da resposta"
    ];

    const worksheet =
      dadosPlanilha.length > 0
        ? XLSX.utils.json_to_sheet(dadosPlanilha, { header: cabecalhos })
        : XLSX.utils.aoa_to_sheet([cabecalhos]);

    worksheet["!cols"] = [
      { wch: 28 }, // Nome
      { wch: 18 }, // Telefone
      { wch: 18 }, // Status
      { wch: 20 }, // Nº de acompanhantes
      { wch: 35 }, // Nomes dos acompanhantes
      { wch: 40 }, // Mensagem
      { wch: 22 }  // Data/hora da resposta
    ];

    if (formato === "csv") {
      const csvConteudo = XLSX.utils.sheet_to_csv(worksheet, { FS: ";" });
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="confirmacoes-presenca-${CONFIG_FESTA.nomeAniversariante.toLowerCase().replace(/\s+/g, "-")}.csv"`
      );
      return res.send("\uFEFF" + csvConteudo);
    } else {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Confirmações RSVP");
      const bufferXlsx = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="confirmacoes-presenca-${CONFIG_FESTA.nomeAniversariante.toLowerCase().replace(/\s+/g, "-")}.xlsx"`
      );
      return res.send(bufferXlsx);
    }
  } catch (err) {
    console.error("Erro ao exportar planilha:", err);
    return res.status(500).send("Erro ao gerar arquivo de exportação.");
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log("====================================================================");
  console.log(`🌸 Site de RSVP no ar para o aniversário de ${CONFIG_FESTA.nomeAniversariante}!`);
  console.log(`👉 Página do Convidado: http://localhost:${PORT}`);
  console.log(`🔐 Painel da Anfitriã:  http://localhost:${PORT}/admin`);
  console.log(`🔑 Senha do Painel:     ${process.env.ADMIN_PASSWORD || CONFIG_FESTA.senhaAdmin}`);
  console.log("====================================================================");
});
