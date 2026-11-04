/**
 * ============================================================================
 * 🌸 LÓGICA DA PÁGINA DO CONVIDADO (RSVP, CONTAGEM, CALENDÁRIO E PÉTALAS) 🌸
 * ============================================================================
 */

// Valores padrão caso o servidor ainda esteja carregando (sincronizados com config.js)
let DADOS_FESTA = {
  nomeAniversariante: "Maria Eduarda",
  idade: "21 anos",
  dataHoraTexto: "16 de Janeiro de 2027, Sábado",
  dataHoraISO: "2027-01-16T19:00:00-03:00",
  duracaoHoras: 6,
  nomeLocal: "Local da Festa",
  enderecoLocal: "R. Argino da Silva Leite, 181 - Santa Rita, Piracicaba - SP, 13423-215",
  linkMapa: "https://www.google.com/maps/search/?api=1&query=R.+Argino+da+Silva+Leite,+181+-+Santa+Rita,+Piracicaba+-+SP,+13423-215",
  fraseConvite: "Um novo ciclo floresce e a sua presença tornará esse dia ainda mais especial!"
};

// ============================================================================
// 1. CARREGAMENTO DAS INFORMAÇÕES DA FESTA E CONTAGEM REGRESSIVA
// ============================================================================

async function carregarConfiguracoesFesta() {
  try {
    const resposta = await fetch("/api/config");
    if (resposta.ok) {
      const configServidor = await resposta.json();
      DADOS_FESTA = { ...DADOS_FESTA, ...configServidor };
    }
  } catch (erro) {
    console.warn("Usando configurações locais padrão:", erro);
  }

  aplicarDadosNaPagina();
  iniciarContagemRegressiva();
  configurarLinksCalendario();
}

function aplicarDadosNaPagina() {
  document.title = `Aniversário de ${DADOS_FESTA.nomeAniversariante} (${DADOS_FESTA.idade}) 🌸 Confirmação de Presença`;

  document.getElementById("el-nome-aniversariante").textContent = DADOS_FESTA.nomeAniversariante;
  document.getElementById("el-idade").textContent = DADOS_FESTA.idade;
  document.getElementById("el-frase-convite").textContent = DADOS_FESTA.fraseConvite;
  document.getElementById("el-data-hora").textContent = DADOS_FESTA.dataHoraTexto;
  document.getElementById("el-nome-local").textContent = DADOS_FESTA.nomeLocal;
  document.getElementById("el-endereco-local").textContent = DADOS_FESTA.enderecoLocal;

  const linkMapaEl = document.getElementById("el-link-mapa");
  const urlMapa =
    DADOS_FESTA.linkMapa && DADOS_FESTA.linkMapa.trim() !== ""
      ? DADOS_FESTA.linkMapa
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          DADOS_FESTA.enderecoLocal
        )}`;
  linkMapaEl.href = urlMapa;
}

let intervaloContagem = null;

function iniciarContagemRegressiva() {
  if (intervaloContagem) clearInterval(intervaloContagem);

  const atualizar = () => {
    const agora = new Date().getTime();
    const dataAlvo = new Date(DADOS_FESTA.dataHoraISO).getTime();
    const diferenca = dataAlvo - agora;

    const elDias = document.getElementById("cd-dias");
    const elHoras = document.getElementById("cd-horas");
    const elMinutos = document.getElementById("cd-minutos");
    const elSegundos = document.getElementById("cd-segundos");
    const elStatus = document.getElementById("el-status-contagem");

    if (isNaN(dataAlvo) || diferenca <= 0) {
      elDias.textContent = "00";
      elHoras.textContent = "00";
      elMinutos.textContent = "00";
      elSegundos.textContent = "00";
      elStatus.textContent = "🎉 O grande dia chegou! Vamos celebrar! 🌸";
      return;
    }

    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

    elDias.textContent = String(dias).padStart(2, "0");
    elHoras.textContent = String(horas).padStart(2, "0");
    elMinutos.textContent = String(minutos).padStart(2, "0");
    elSegundos.textContent = String(segundos).padStart(2, "0");
  };

  atualizar();
  intervaloContagem = setInterval(atualizar, 1000);
}

// ============================================================================
// 2. MÁSCARA DE TELEFONE BRASILEIRO E CAMPOS DINÂMICOS DE ACOMPANHANTES
// ============================================================================

function aplicarMascaraTelefone(valor) {
  let numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length === 0) return "";
  if (numeros.length <= 2) return `(${numeros}`;
  if (numeros.length <= 6) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
}

const inputTelefone = document.getElementById("campo-telefone");
inputTelefone.addEventListener("input", (e) => {
  e.target.value = aplicarMascaraTelefone(e.target.value);
  e.target.classList.remove("erro-campo");
});

// Alternância Sim / Não para mostrar ou ocultar acompanhantes
const radiosComparecer = document.querySelectorAll('input[name="comparecer"]');
const blocoAcompanhantes = document.getElementById("bloco-acompanhantes");
const selectQtdAcompanhantes = document.getElementById("campo-qtd-acompanhantes");
const containerNomesAcompanhantes = document.getElementById("container-nomes-acompanhantes");
const divInputsAcompanhantes = document.getElementById("inputs-acompanhantes");

radiosComparecer.forEach((radio) => {
  radio.addEventListener("change", () => {
    const vaiComparecer =
      document.querySelector('input[name="comparecer"]:checked')?.value === "Sim";

    if (vaiComparecer) {
      blocoAcompanhantes.style.display = "block";
    } else {
      blocoAcompanhantes.style.display = "none";
      selectQtdAcompanhantes.value = "0";
      atualizarCamposNomesAcompanhantes(0);
    }
  });
});

function atualizarCamposNomesAcompanhantes(quantidade) {
  // Salva valores já digitados para não perder se o convidado aumentar o número
  const valoresAtuais = Array.from(
    divInputsAcompanhantes.querySelectorAll(".input-nome-acompanhante")
  ).map((input) => input.value);

  divInputsAcompanhantes.innerHTML = "";

  if (quantidade <= 0) {
    containerNomesAcompanhantes.style.display = "none";
    return;
  }

  containerNomesAcompanhantes.style.display = "flex";

  for (let i = 1; i <= quantidade; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "item-acompanhante";
    wrapper.style.marginBottom = "8px";

    const badgeNumero = document.createElement("span");
    badgeNumero.className = "numero-acompanhante";
    badgeNumero.textContent = i;

    const input = document.createElement("input");
    input.type = "text";
    input.className = "input-texto input-nome-acompanhante";
    input.placeholder = `Nome completo do ${i}º acompanhante`;
    input.required = true;
    input.value = valoresAtuais[i - 1] || "";

    input.addEventListener("input", () => {
      input.classList.remove("erro-campo");
    });

    wrapper.appendChild(badgeNumero);
    wrapper.appendChild(input);
    divInputsAcompanhantes.appendChild(wrapper);
  }
}

selectQtdAcompanhantes.addEventListener("change", (e) => {
  const qtd = parseInt(e.target.value, 10) || 0;
  atualizarCamposNomesAcompanhantes(qtd);
});

// ============================================================================
// 3. VALIDAÇÃO GENTIL E ENVIO DO FORMULÁRIO
// ============================================================================

const formRsvp = document.getElementById("form-rsvp");
const alertaErro = document.getElementById("alerta-erro");
const textoAlertaErro = document.getElementById("texto-alerta-erro");
const botaoEnviar = document.getElementById("botao-enviar");
const textoBotaoEnviar = document.getElementById("texto-botao-enviar");

function mostrarErroFormulario(mensagem, elementoComErro = null) {
  textoAlertaErro.textContent = mensagem;
  alertaErro.classList.add("visivel");

  if (elementoComErro) {
    elementoComErro.classList.add("erro-campo");
    elementoComErro.focus();
  }

  alertaErro.scrollIntoView({ behavior: "smooth", block: "center" });
}

function ocultarErroFormulario() {
  alertaErro.classList.remove("visivel");
  document.querySelectorAll(".erro-campo").forEach((el) => el.classList.remove("erro-campo"));
}

document.getElementById("campo-nome").addEventListener("input", (e) => {
  e.target.classList.remove("erro-campo");
});

formRsvp.addEventListener("submit", async (e) => {
  e.preventDefault();
  ocultarErroFormulario();

  const campoNome = document.getElementById("campo-nome");
  const nome = campoNome.value.trim();
  const telefone = inputTelefone.value.trim();
  const numerosTelefone = telefone.replace(/\D/g, "");
  const comparecer =
    document.querySelector('input[name="comparecer"]:checked')?.value || "Sim";
  const qtdAcompanhantes =
    comparecer === "Sim" ? parseInt(selectQtdAcompanhantes.value, 10) || 0 : 0;

  // 1. Valida Nome Completo
  if (!nome || nome.length < 3 || !nome.includes(" ")) {
    return mostrarErroFormulario(
      "Por gentileza, digite seu nome e sobrenome para identificarmos você na lista! 🌸",
      campoNome
    );
  }

  // 2. Valida Telefone Brasileiro (DDD + 8 ou 9 dígitos)
  if (numerosTelefone.length < 10 || numerosTelefone.length > 11) {
    return mostrarErroFormulario(
      "Por favor, informe um telefone ou WhatsApp válido com DDD (ex: (11) 99999-9999). 📱",
      inputTelefone
    );
  }

  // 3. Valida Nomes dos Acompanhantes se houver
  const inputsAcomp = Array.from(
    divInputsAcompanhantes.querySelectorAll(".input-nome-acompanhante")
  );
  const nomesAcompanhantes = [];

  if (comparecer === "Sim" && qtdAcompanhantes > 0) {
    for (let i = 0; i < inputsAcomp.length; i++) {
      const nomeAcomp = inputsAcomp[i].value.trim();
      if (!nomeAcomp || nomeAcomp.length < 2) {
        return mostrarErroFormulario(
          `Por gentileza, preencha o nome do ${i + 1}º acompanhante. 🌷`,
          inputsAcomp[i]
        );
      }
      nomesAcompanhantes.push(nomeAcomp);
    }
  }

  const mensagem = document.getElementById("campo-mensagem").value.trim();

  // Envia para o servidor
  botaoEnviar.disabled = true;
  textoBotaoEnviar.textContent = "Enviando com carinho...";

  try {
    const resposta = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        telefone,
        comparecer,
        qtd_acompanhantes: qtdAcompanhantes,
        nomes_acompanhantes: nomesAcompanhantes,
        mensagem
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarErroFormulario(dados.erro || "Não foi possível enviar sua confirmação.");
      botaoEnviar.disabled = false;
      textoBotaoEnviar.textContent = "Confirmar Presença";
      return;
    }

    exibirTelaAgradecimento({
      nome,
      comparecer,
      atualizado: dados.atualizado
    });
  } catch (erro) {
    console.error("Erro ao enviar RSVP:", erro);
    mostrarErroFormulario(
      "Houve uma falha de conexão ao enviar sua resposta. Verifique sua internet e tente novamente."
    );
  } finally {
    botaoEnviar.disabled = false;
    textoBotaoEnviar.textContent = "Confirmar Presença";
  }
});

// ============================================================================
// 4. TELA DE AGRADECIMENTO E INTEGRAÇÃO COM CALENDÁRIO (GOOGLE & .ICS)
// ============================================================================

function exibirTelaAgradecimento({ nome, comparecer, atualizado }) {
  const primeiroNome = nome.split(" ")[0];
  const secaoFormulario = document.getElementById("secao-formulario");
  const telaAgradecimento = document.getElementById("tela-agradecimento");
  const iconeAgradecimento = document.getElementById("icone-agradecimento");
  const tituloAgradecimento = document.getElementById("titulo-agradecimento");
  const textoAgradecimento = document.getElementById("texto-agradecimento");
  const badgeAtualizado = document.getElementById("badge-atualizado");
  const areaCalendario = document.getElementById("area-calendario");

  secaoFormulario.style.display = "none";
  telaAgradecimento.classList.add("visivel");

  badgeAtualizado.style.display = atualizado ? "inline-block" : "none";

  if (comparecer === "Sim") {
    iconeAgradecimento.textContent = "🌸";
    tituloAgradecimento.textContent = `Oba, ${primeiroNome}! Presença confirmada!`;
    textoAgradecimento.textContent = `Que felicidade saber que você estará conosco para celebrar os ${DADOS_FESTA.idade} da ${DADOS_FESTA.nomeAniversariante}! Nosso jardim ficará ainda mais florido e alegre com você.`;
    areaCalendario.style.display = "block";

    // Dispara a chuva comemorativa de pétalas coloridas!
    dispararChuvaDePetalas();
  } else {
    iconeAgradecimento.textContent = "💌";
    tituloAgradecimento.textContent = `Obrigada por avisar, ${primeiroNome}!`;
    textoAgradecimento.textContent = `Sentiremos muito a sua falta na comemoração da ${DADOS_FESTA.nomeAniversariante}, mas agradecemos de coração pelo carinho de nos responder. Esperamos nos ver em breve!`;
    areaCalendario.style.display = "none";
  }

  telaAgradecimento.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.getElementById("btn-editar-resposta").addEventListener("click", () => {
  document.getElementById("tela-agradecimento").classList.remove("visivel");
  document.getElementById("secao-formulario").style.display = "block";
});

function formatarDataCalendarioUTC(data) {
  return data.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function configurarLinksCalendario() {
  const inicio = new Date(DADOS_FESTA.dataHoraISO);
  if (isNaN(inicio.getTime())) return;

  const duracaoMs = (Number(DADOS_FESTA.duracaoHoras) || 5) * 60 * 60 * 1000;
  const fim = new Date(inicio.getTime() + duracaoMs);

  const tituloEvento = `🌸 Aniversário de ${DADOS_FESTA.nomeAniversariante} (${DADOS_FESTA.idade})`;
  const localCompleto = DADOS_FESTA.enderecoLocal;
  const descricaoEvento = DADOS_FESTA.fraseConvite;

  // Link do Google Calendar
  const datasGoogle = `${formatarDataCalendarioUTC(inicio)}/${formatarDataCalendarioUTC(fim)}`;
  const urlGoogleCalendar =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(tituloEvento)}` +
    `&dates=${datasGoogle}` +
    `&details=${encodeURIComponent(descricaoEvento)}` +
    `&location=${encodeURIComponent(localCompleto)}`;

  const btnGoogle = document.getElementById("btn-google-calendar");
  if (btnGoogle) {
    btnGoogle.href = urlGoogleCalendar;
  }

  // Botão de download do arquivo .ics (Apple Calendar, Outlook, celular)
  const btnIcs = document.getElementById("btn-baixar-ics");
  if (btnIcs) {
    btnIcs.onclick = () => {
      const conteudoICS = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Aniversario Jardim Florido//RSVP//PT",
        "BEGIN:VEVENT",
        `UID:aniversario-${Date.now()}@rsvp.local`,
        `DTSTAMP:${formatarDataCalendarioUTC(new Date())}`,
        `DTSTART:${formatarDataCalendarioUTC(inicio)}`,
        `DTEND:${formatarDataCalendarioUTC(fim)}`,
        `SUMMARY:${tituloEvento}`,
        `DESCRIPTION:${descricaoEvento.replace(/\n/g, "\\n")}`,
        `LOCATION:${localCompleto}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([conteudoICS], { type: "text/calendar;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `aniversario-${DADOS_FESTA.nomeAniversariante.toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }
}

// ============================================================================
// 5. ANIMAÇÃO DE PÉTALAS COLORIDAS (AMBIENTE SUTIL + CHUVA NA CONFIRMAÇÃO)
// ============================================================================

const canvas = document.getElementById("canvas-petalas");
const ctx = canvas.getContext("2d");

const CORES_PETALAS = [
  "#E85D88", // Rosa
  "#FF6F61", // Coral
  "#F9C74F", // Amarelo
  "#9B72CF", // Lilás
  "#F8961E", // Laranja
  "#F48FB1", // Rosa claro
  "#4D9078"  // Verde-folha suave
];

let listaPetalas = [];

function redimensionarCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", redimensionarCanvas);
redimensionarCanvas();

class Petala {
  constructor(modoChuva = false) {
    this.modoChuva = modoChuva;
    this.reiniciar(true);
  }

  reiniciar(inicial = false) {
    this.x = Math.random() * canvas.width;
    this.y = inicial && !this.modoChuva ? Math.random() * canvas.height : -20 - Math.random() * 80;
    this.tamanho = this.modoChuva ? 7 + Math.random() * 9 : 6 + Math.random() * 6;
    this.cor = CORES_PETALAS[Math.floor(Math.random() * CORES_PETALAS.length)];
    this.velocidadeY = this.modoChuva ? 2.2 + Math.random() * 3.2 : 0.45 + Math.random() * 0.65;
    this.velocidadeX = (Math.random() - 0.5) * (this.modoChuva ? 2.4 : 0.7);
    this.angulo = Math.random() * Math.PI * 2;
    this.velRotacao = (Math.random() - 0.5) * 0.04;
    this.oscilacao = Math.random() * Math.PI * 2;
    this.opacidade = this.modoChuva ? 0.92 : 0.38;
    this.ativa = true;
  }

  atualizar() {
    this.oscilacao += 0.025;
    this.y += this.velocidadeY;
    this.x += this.velocidadeX + Math.sin(this.oscilacao) * 0.65;
    this.angulo += this.velRotacao;

    if (this.y > canvas.height + 30) {
      if (this.modoChuva) {
        this.ativa = false;
      } else {
        this.reiniciar(false);
      }
    }
  }

  desenhar() {
    if (!this.ativa) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angulo);
    ctx.globalAlpha = this.opacidade;
    ctx.fillStyle = this.cor;

    // Desenha o formato orgânico de uma pétala de flor
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      this.tamanho,
      -this.tamanho,
      this.tamanho * 1.6,
      this.tamanho * 0.6,
      0,
      this.tamanho * 1.7
    );
    ctx.bezierCurveTo(
      -this.tamanho * 1.6,
      this.tamanho * 0.6,
      -this.tamanho,
      -this.tamanho,
      0,
      0
    );
    ctx.fill();
    ctx.restore();
  }
}

// Cria 12 pétalas sutis caindo suavemente no fundo da página
for (let i = 0; i < 12; i++) {
  listaPetalas.push(new Petala(false));
}

/**
 * Dispara uma chuva festiva de pétalas coloridas quando o convidado confirma presença!
 */
function dispararChuvaDePetalas() {
  for (let i = 0; i < 110; i++) {
    setTimeout(() => {
      listaPetalas.push(new Petala(true));
    }, i * 18);
  }
}

function animarPetalas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  listaPetalas = listaPetalas.filter((p) => p.ativa);
  for (const petala of listaPetalas) {
    petala.atualizar();
    petala.desenhar();
  }

  requestAnimationFrame(animarPetalas);
}

// Inicializa a página
carregarConfiguracoesFesta();
animarPetalas();

