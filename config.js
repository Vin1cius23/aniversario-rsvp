/**
 * ============================================================================
 * 🌸 CONFIGURAÇÕES DA FESTA (EDITE AQUI AS INFORMAÇÕES DO ANIVERSÁRIO) 🌸
 * ============================================================================
 * Basta alterar os textos entre aspas abaixo e reiniciar o servidor.
 */

const CONFIG_FESTA = {
  // Nome da aniversariante: [NOME]
  nomeAniversariante: "Helena",

  // Idade que está fazendo: [IDADE]
  idade: "30 anos",

  // Data e horário por extenso para exibição: [DATA E HORA]
  dataHoraTexto: "12 de Dezembro de 2026, Sábado, às 16h00",

  // Data e horário no formato AAAA-MM-DDTHH:MM:SS (usado na contagem regressiva e no Calendário)
  dataHoraISO: "2026-12-12T16:00:00-03:00",

  // Duração estimada da festa em horas (para o evento na agenda/calendário)
  duracaoHoras: 6,

  // Local e endereço da festa: [LOCAL]
  nomeLocal: "Espaço Jardim das Flores",
  enderecoLocal: "Rua das Orquídeas, 250 - Jardim Botânico, São Paulo - SP",

  // Link para o botão "Ver no mapa" (se deixar vazio, o sistema gera automaticamente pelo endereço acima)
  linkMapa: "https://www.google.com/maps/search/?api=1&query=Rua+das+Orquideas+250+Jardim+Botanico+Sao+Paulo",

  // Observações (dress code, o que levar, etc.): [OBSERVAÇÕES]
  observacoes: "Traje sugerido: Esporte Fino ou tons primaveris/florais. Confirme sua presença até o dia 01/12 para prepararmos tudo com muito carinho!",

  // Frase de boas-vindas no topo do convite
  fraseConvite: "Um novo ciclo floresce e a sua presença tornará nosso jardim ainda mais especial!",

  // Senha para acessar o Painel da Anfitriã em /admin
  senhaAdmin: "flores123"
};

module.exports = CONFIG_FESTA;

