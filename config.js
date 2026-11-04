/**
 * ============================================================================
 * 🌸 CONFIGURAÇÕES DA FESTA (EDITE AQUI AS INFORMAÇÕES DO ANIVERSÁRIO) 🌸
 * ============================================================================
 * Basta alterar os textos entre aspas abaixo e reiniciar o servidor.
 */

const CONFIG_FESTA = {
  // Nome da aniversariante: [NOME]
  nomeAniversariante: "Maria Eduarda",

  // Idade que está fazendo: [IDADE]
  idade: "21 anos",

  // Data e horário por extenso para exibição: [DATA E HORA]
  dataHoraTexto: "16 de Janeiro de 2027, Sábado",

  // Data e horário no formato AAAA-MM-DDTHH:MM:SS (usado na contagem regressiva e no Calendário)
  dataHoraISO: "2027-01-16T19:00:00-03:00",

  // Duração estimada da festa em horas (para o evento na agenda/calendário)
  duracaoHoras: 6,

  // Local e endereço da festa: [LOCAL]
  nomeLocal: "Local da Festa",
  enderecoLocal: "R. Argino da Silva Leite, 181 - Santa Rita, Piracicaba - SP, 13423-215",

  // Link para o botão "Ver no mapa"
  linkMapa: "https://www.google.com/maps/search/?api=1&query=R.+Argino+da+Silva+Leite,+181+-+Santa+Rita,+Piracicaba+-+SP,+13423-215",

  // Frase de boas-vindas no topo do convite
  fraseConvite: "Um novo ciclo floresce e a sua presença tornará esse dia ainda mais especial!",

  // Senha para acessar o Painel da Anfitriã em /admin
  senhaAdmin: "flores123",

  // URL do Google Apps Script para salvar na Planilha do Google Drive (opcional, mas recomendado para o plano grátis do Render)
  urlGoogleSheets: "https://script.google.com/macros/s/AKfycbz4jr1Me5e4i4KWuZBaD4bODx8fqQy962lbyxobD9D6VLD-uGtXOf4AHYIRtWRTOks/exec"
};

module.exports = CONFIG_FESTA;
