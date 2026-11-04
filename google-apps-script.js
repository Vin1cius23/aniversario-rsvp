/**
 * ============================================================================
 * 🌸 CÓDIGO PARA COLAR NO GOOGLE APPS SCRIPT DA SUA PLANILHA 🌸
 * ============================================================================
 * Como usar:
 * 1. Crie uma planilha nova em https://sheets.new
 * 2. No menu do topo, clique em: Extensões -> Apps Script
 * 3. Apague tudo que estiver lá e cole todo este código abaixo.
 * 4. Clique no ícone de Disquete (Salvar).
 * 5. Clique no botão azul "Implantar" -> "Nova implantação".
 * 6. Clique na engrenagem ao lado de "Selecionar tipo" e escolha "App da Web".
 * 7. Em "Quem pode acessar", mude para: "Qualquer pessoa".
 * 8. Clique em "Implantar", autorize o acesso com sua conta Google e copie a URL gerada!
 */

function obterAba() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheets()[0];

  // Se a planilha estiver vazia, cria o cabeçalho automaticamente na linha 1
  if (aba.getLastRow() === 0) {
    aba.appendRow([
      "ID",
      "Nome",
      "Telefone",
      "Telefone Limpo",
      "Status",
      "Nº de acompanhantes",
      "Nomes dos acompanhantes",
      "Mensagem",
      "Data/hora da resposta"
    ]);
    aba.getRange("A1:I1").setFontWeight("bold").setBackground("#FCE4EC");
  }
  return aba;
}

// Quando o site pede a lista de convidados (GET)
function doGet(e) {
  var aba = obterAba();
  var dados = aba.getDataRange().getValues();
  var respostas = [];

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[1] && !linha[2]) continue;

    respostas.push({
      id: Number(linha[0]) || i,
      nome: String(linha[1] || ""),
      telefone: String(linha[2] || ""),
      telefone_limpo: String(linha[3] || ""),
      comparecer: String(linha[4] || "Sim"),
      qtd_acompanhantes: Number(linha[5] || 0),
      nomes_acompanhantes: String(linha[6] || ""),
      mensagem: String(linha[7] || ""),
      data_resposta: String(linha[8] || "")
    });
  }

  // Mais recentes primeiro
  respostas.reverse();

  return ContentService.createTextOutput(JSON.stringify({ sucesso: true, respostas: respostas }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Quando um convidado confirma presença ou a anfitriã exclui uma linha (POST)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var aba = obterAba();
    var corpo = JSON.parse(e.postData.contents);
    var acao = corpo.acao || "salvar";
    var dados = aba.getDataRange().getValues();

    // Ação de excluir pelo Painel /admin
    if (acao === "excluir") {
      var idExcluir = String(corpo.id);
      for (var i = 1; i < dados.length; i++) {
        if (String(dados[i][0]) === idExcluir) {
          aba.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ sucesso: true, excluido: true }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ sucesso: true, excluido: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Ação de salvar ou atualizar (mesmo telefone atualiza a linha existente)
    var telLimpo = String(corpo.telefone_limpo || "").replace(/\D/g, "");
    var linhaExistente = -1;
    var idExistente = null;

    for (var j = 1; j < dados.length; j++) {
      var telLinha = String(dados[j][3] || "").replace(/\D/g, "");
      if (telLinha && telLinha === telLimpo) {
        linhaExistente = j + 1;
        idExistente = dados[j][0];
        break;
      }
    }

    var novoId = idExistente || new Date().getTime();
    var valoresLinha = [
      novoId,
      corpo.nome || "",
      corpo.telefone || "",
      "'" + telLimpo,
      corpo.comparecer || "Sim",
      Number(corpo.qtd_acompanhantes || 0),
      corpo.nomes_acompanhantes || "",
      corpo.mensagem || "",
      corpo.data_resposta || ""
    ];

    if (linhaExistente > 0) {
      aba.getRange(linhaExistente, 1, 1, valoresLinha.length).setValues([valoresLinha]);
      return ContentService.createTextOutput(JSON.stringify({ sucesso: true, atualizado: true }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      aba.appendRow(valoresLinha);
      return ContentService.createTextOutput(JSON.stringify({ sucesso: true, atualizado: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } finally {
    lock.releaseLock();
  }
}
