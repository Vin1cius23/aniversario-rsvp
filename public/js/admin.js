/**
 * ============================================================================
 * 🌸 LÓGICA DO PAINEL DA ANFITRIÃ (/admin) 🌸
 * ============================================================================
 */

const CHAVE_SESSAO_SENHA = "rsvp_senha_admin";

let senhaAtual = sessionStorage.getItem(CHAVE_SESSAO_SENHA) || "";
let todasRespostas = [];
let filtroStatusAtual = "todos";
let termoBuscaAtual = "";
let nomeAniversariante = "Aniversariante";

const secaoLogin = document.getElementById("secao-login-admin");
const secaoPainel = document.getElementById("secao-painel-admin");
const formLogin = document.getElementById("form-login-admin");
const campoSenha = document.getElementById("campo-senha-admin");
const erroLogin = document.getElementById("erro-login-admin");
const textoErroLogin = document.getElementById("texto-erro-login");

// ============================================================================
// 1. AUTENTICAÇÃO E INICIALIZAÇÃO DO PAINEL
// ============================================================================

async function carregarConfigFestaAdmin() {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const cfg = await res.json();
      nomeAniversariante = cfg.nomeAniversariante || "Aniversariante";
      document.getElementById("admin-nome-festa").textContent =
        `${cfg.nomeAniversariante} (${cfg.idade})`;
    }
  } catch (e) {
    console.warn("Erro ao carregar config no admin:", e);
  }
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  erroLogin.classList.remove("visivel");

  const senhaDigitada = campoSenha.value.trim();
  if (!senhaDigitada) return;

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": senhaDigitada
      }
    });

    if (!res.ok) {
      textoErroLogin.textContent = "Senha incorreta! Verifique o arquivo config.js.";
      erroLogin.classList.add("visivel");
      return;
    }

    senhaAtual = senhaDigitada;
    sessionStorage.setItem(CHAVE_SESSAO_SENHA, senhaAtual);
    mostrarPainel();
  } catch (erro) {
    textoErroLogin.textContent = "Erro de conexão com o servidor.";
    erroLogin.classList.add("visivel");
  }
});

function mostrarPainel() {
  secaoLogin.style.display = "none";
  secaoPainel.style.display = "block";
  carregarDadosPainel();
}

function sairDoPainel() {
  senhaAtual = "";
  sessionStorage.removeItem(CHAVE_SESSAO_SENHA);
  campoSenha.value = "";
  secaoPainel.style.display = "none";
  secaoLogin.style.display = "block";
}

document.getElementById("btn-sair-admin").addEventListener("click", sairDoPainel);
document.getElementById("btn-atualizar-lista").addEventListener("click", carregarDadosPainel);

// ============================================================================
// 2. BUSCA DE RESPOSTAS E RESUMO ESTATÍSTICO
// ============================================================================

async function carregarDadosPainel() {
  try {
    const res = await fetch("/api/admin/rsvps", {
      headers: { "x-admin-password": senhaAtual }
    });

    if (res.status === 401) {
      sairDoPainel();
      return;
    }

    const dados = await res.json();
    todasRespostas = dados.respostas || [];

    atualizarCardsResumo(dados.resumo);
    renderizarTabela();
  } catch (erro) {
    console.error("Erro ao carregar confirmações:", erro);
  }
}

function atualizarCardsResumo(resumo) {
  if (!resumo) return;

  document.getElementById("resumo-total-pessoas").textContent = resumo.totalPessoasConfirmadas;
  document.getElementById("resumo-detalhe-pessoas").textContent =
    `${resumo.totalConfirmados} convidado(s) + ${resumo.totalAcompanhantes} acompanhante(s)`;

  document.getElementById("resumo-confirmados").textContent = resumo.totalConfirmados;
  document.getElementById("resumo-acompanhantes").textContent =
    `+ ${resumo.totalAcompanhantes} acompanhante(s)`;

  document.getElementById("resumo-recusas").textContent = resumo.totalRecusas;
  document.getElementById("resumo-total-respostas").textContent = resumo.totalRespostas;
}

// ============================================================================
// 3. TABELA, FILTROS, BUSCA, WHATSAPP E EXCLUSÃO
// ============================================================================

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}

function gerarLinkWhatsApp(telefone, nome, comparecer) {
  let digitos = String(telefone || "").replace(/\D/g, "");
  // Adiciona DDI 55 (Brasil) caso não tenha
  if (digitos.length === 10 || digitos.length === 11) {
    digitos = "55" + digitos;
  }

  const primeiroNome = String(nome || "").split(" ")[0];
  const textoMsg =
    comparecer === "Sim"
      ? `Olá, ${primeiroNome}! 🌸 Tudo bem? Recebemos a sua confirmação de presença para o aniversário da ${nomeAniversariante}! Muito obrigada pelo carinho!`
      : `Olá, ${primeiroNome}! 🌸 Tudo bem? Recebemos seu aviso sobre o aniversário da ${nomeAniversariante}. Agradecemos muito por nos avisar!`;

  return `https://wa.me/${digitos}?text=${encodeURIComponent(textoMsg)}`;
}

function renderizarTabela() {
  const tbody = document.getElementById("corpo-tabela-respostas");
  const estadoVazio = document.getElementById("estado-vazio-tabela");
  const textoEstadoVazio = document.getElementById("texto-estado-vazio");

  const termo = termoBuscaAtual.toLowerCase().trim();

  const filtradas = todasRespostas.filter((item) => {
    const passaFiltroStatus =
      filtroStatusAtual === "todos" || item.comparecer === filtroStatusAtual;

    if (!passaFiltroStatus) return false;
    if (!termo) return true;

    const textoCompleto = [
      item.nome,
      item.telefone,
      item.nomes_acompanhantes,
      item.restricao_alimentar,
      item.mensagem
    ]
      .join(" ")
      .toLowerCase();

    return textoCompleto.includes(termo);
  });

  tbody.innerHTML = "";

  if (filtradas.length === 0) {
    estadoVazio.style.display = "block";
    textoEstadoVazio.textContent =
      todasRespostas.length === 0
        ? "Nenhuma confirmação de presença registrada até o momento."
        : "Nenhum convidado encontrado para o filtro ou busca selecionada.";
    return;
  }

  estadoVazio.style.display = "none";

  filtradas.forEach((r) => {
    const tr = document.createElement("tr");

    const badgeClasse = r.comparecer === "Sim" ? "sim" : "nao";
    const badgeTexto = r.comparecer === "Sim" ? "🌸 Vai comparecer" : "💌 Não irá";
    const linkWa = gerarLinkWhatsApp(r.telefone, r.nome, r.comparecer);

    tr.innerHTML = `
      <td><strong>${escaparHTML(r.nome)}</strong></td>
      <td style="white-space: nowrap;">${escaparHTML(r.telefone)}</td>
      <td><span class="badge-status ${badgeClasse}">${badgeTexto}</span></td>
      <td style="text-align: center; font-weight: 600;">${r.comparecer === "Sim" ? r.qtd_acompanhantes : 0}</td>
      <td>${r.nomes_acompanhantes ? escaparHTML(r.nomes_acompanhantes) : '<span style="color:#B09FA1;">—</span>'}</td>
      <td>${r.mensagem ? escaparHTML(r.mensagem) : '<span style="color:#B09FA1;">—</span>'}</td>
      <td style="font-size: 0.8rem; color: var(--texto-medio); white-space: nowrap;">${escaparHTML(r.data_resposta)}</td>
      <td>
        <div class="acoes-linha">
          <a
            href="${linkWa}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-whatsapp"
            title="Abrir conversa no WhatsApp com ${escaparHTML(r.nome)}"
          >
            💬 WhatsApp
          </a>
          <button
            type="button"
            class="btn-excluir"
            data-id="${r.id}"
            data-nome="${escaparHTML(r.nome)}"
            title="Excluir esta resposta"
          >
            🗑️ Excluir
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Eventos de exclusão
  tbody.querySelectorAll(".btn-excluir").forEach((botao) => {
    botao.addEventListener("click", async () => {
      const id = botao.getAttribute("data-id");
      const nome = botao.getAttribute("data-nome");

      const confirmar = window.confirm(
        `Tem certeza que deseja excluir a resposta de "${nome}"? Esta ação não pode ser desfeita.`
      );
      if (!confirmar) return;

      try {
        const res = await fetch(`/api/admin/rsvps/${id}`, {
          method: "DELETE",
          headers: { "x-admin-password": senhaAtual }
        });

        if (res.ok) {
          carregarDadosPainel();
        } else {
          alert("Não foi possível excluir a resposta.");
        }
      } catch (erro) {
        alert("Erro de conexão ao tentar excluir.");
      }
    });
  });
}

// Eventos de Busca e Filtros
document.getElementById("input-busca").addEventListener("input", (e) => {
  termoBuscaAtual = e.target.value;
  renderizarTabela();
});

document.querySelectorAll(".botao-filtro").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".botao-filtro").forEach((b) => b.classList.remove("ativo"));
    btn.classList.add("ativo");
    filtroStatusAtual = btn.getAttribute("data-filtro");
    renderizarTabela();
  });
});

// ============================================================================
// 4. DOWNLOAD DE PLANILHA (.XLSX E .CSV)
// ============================================================================

document.getElementById("btn-baixar-xlsx").addEventListener("click", () => {
  window.location.href = `/api/admin/export/xlsx?senha=${encodeURIComponent(senhaAtual)}`;
});

document.getElementById("btn-baixar-csv").addEventListener("click", () => {
  window.location.href = `/api/admin/export/csv?senha=${encodeURIComponent(senhaAtual)}`;
});

// ============================================================================
// INICIALIZAÇÃO AUTOMÁTICA SE JÁ ESTIVER LOGADO NA SESSÃO
// ============================================================================

carregarConfigFestaAdmin();

if (senhaAtual) {
  fetch("/api/admin/login", {
    method: "POST",
    headers: { "x-admin-password": senhaAtual }
  })
    .then((res) => {
      if (res.ok) {
        mostrarPainel();
      } else {
        sairDoPainel();
      }
    })
    .catch(() => sairDoPainel());
}

