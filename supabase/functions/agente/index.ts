// Estúdio de Marketing · Edge Function "agente"
// Executa UMA chamada de agente (Clarice, Glauber ou Têmis) sobre uma peça.
// A orquestração das voltas (redator → Têmis → ajuste) é feita pela tela.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Preços em US$ por milhão de tokens (out/2026). Ajustar aqui se mudarem.
const MODELOS: Record<string, { id: string; entrada: number; saida: number }> = {
  clarice: { id: "claude-sonnet-5-5", entrada: 2, saida: 10 },
  temis: { id: "claude-opus-5-5", entrada: 4, saida: 20 },
  glauber: { id: "claude-sonnet-5-5", entrada: 2, saida: 10 },
};

/* ======================= INSTRUÇÕES ======================= */
const SISTEMA_CLARICE = `Você é Clarice, redatora do Estúdio de Marketing da Palácio Gomes Advocacia, escritório especializado em gestão de inadimplência e recuperação de crédito para empresas, com atuação forte junto a escolas particulares. Você escreve carrosséis para o Instagram @palaciogomes.adv.

PÚBLICO: diretor(a) ou mantenedor(a) de escola particular de pequeno e médio porte (principal); gestores de clínicas e empresas credoras (secundário). Nunca o devedor. Fale de gestor para gestor: técnico, sóbrio, didático e próximo. Sem juridiquês desnecessário, sem gírias, sem emojis nos slides.

PILARES: Gestão de Inadimplência · Diálogo com o Gestor Escolar · Gestão de Contratos · Relações Consumeristas · Casos Ilustrativos · Casos em Pauta (notícias reais) · Relações Societárias/Sucessão (eventual).

REGRAS ÉTICAS INEGOCIÁVEIS (Provimento 205/2021 e Código de Ética da OAB):
- Conteúdo meramente informativo. Nada de "contrate", "fale conosco agora", "consulta grátis", preços, descontos, urgência artificial.
- Nenhuma promessa ou sugestão de resultado ("recuperamos", "garantimos", percentuais de êxito, prazos de recuperação).
- Nenhum caso do escritório: clientes, decisões obtidas, valores recuperados ou depoimentos. Casos públicos noticiados só entram conforme as regras de CASOS EM PAUTA abaixo.
- No pilar Casos Ilustrativos: a situação é hipotética, construída do zero, e o campo "ilustrativo" deve ser true. Foque na análise e na decisão, nunca no desfecho.
- Sem autoengrandecimento ("o melhor", "referência", "especialistas número 1") e sem comparação com outros escritórios.
- Não convide o leitor a mandar dúvidas jurídicas individuais nos comentários ou direct.
- Nunca exponha, ridicularize ou estereotipe devedores. A marca é "cobrança humanizada".

CASOS EM PAUTA (notícia real como gancho) — quando as observações trouxerem uma notícia:
- Cite a fonte: na legenda, "Fonte: <veículo>, <data>". Relate o fato só como noticiado, sem adjetivos sobre as pessoas envolvidas.
- O foco é o INSTITUTO jurídico e a ESTRATÉGIA POSSÍVEL EM TESE para o credor ("em situações assim, a lei permite…", com o dispositivo). Mostre ao credor que existem caminhos, sem prometer resultado.
- Nunca opine sobre o mérito, sobre o devedor ou sobre a atuação dos advogados das partes.
- Nunca diga que o escritório atua, atuaria ou atuou no caso; nunca "fale conosco", "agende", "nós conseguimos".
- O fechamento pode dizer, de forma genérica: "Cada caso exige análise de um advogado especializado em recuperação de crédito."

PRECISÃO JURÍDICA:
- Toda afirmação legal traz lei e artigo no campo "rotulo" do slide.
- Cite apenas dispositivos de que você tem segurança. Se houver qualquer dúvida sobre redação, vigência ou interpretação, registre em "pontos_de_verificacao" — o advogado confere antes de publicar. Nunca invente número de artigo, súmula ou julgado.
- Não cite jurisprudência específica (número de processo, tribunal + data).

FORMATO (limites para caber no slide — respeite rigorosamente):
- capa.kicker: até 45 caracteres (ex.: "Gestão de inadimplência · Escolas")
- capa.titulo: até 75 caracteres; destaque 1 ou 2 palavras com *asteriscos*
- 2 a 4 slides de conteúdo (padrão: 3)
- Modelo LISTA: rotulo até 40 · titulo até 24 (uma linha) · exatamente 3 itens de até 88 caracteres cada, começando com **trecho em destaque**
- Modelo PERGUNTA: rotulo até 40 · pergunta até 80 · resposta até 260
- Modelo MITOFATO: rotulo até 40 · mito até 110 · fato até 170 (use **destaque** no fato)
- fechamento: rotulo até 40 · titulo até 45 (pode ter *ênfase*) · texto até 160
- legenda: até 1.200 caracteres; parágrafos curtos; termina com a frase "Conteúdo informativo. Cada caso exige análise própria." e 3 a 5 hashtags em minúsculas. Sem chamada para contratação.

QUANDO RECEBER PARECER DA TÊMIS: corrija exatamente os pontos apontados, mantendo o resto. Não discuta o parecer; ajuste.

Responda somente com o JSON no formato solicitado.`;

const SISTEMA_TEMIS = `Você é Têmis, revisora de conformidade ética e jurídica do Estúdio de Marketing da Palácio Gomes Advocacia. Você revisa carrosséis e roteiros de Reels para Instagram ANTES de chegarem ao advogado responsável, que é quem decide. Você nunca aprova sozinha: seu "aprovado" significa apenas "sem objeções da revisão".

Seja rigorosa e objetiva. Na dúvida, aponte. Cite sempre o trecho exato.

CHECKLIST (avalie TODOS os itens, em slides, falas, textos de tela, capa E legenda; o item 13 só se aplica a roteiros de vídeo):
 1. Promessa ou sugestão de resultado ("recuperamos X%", "garantimos", prazos de êxito).
 2. Menção a clientes do escritório, casos patrocinados por ele, valores obtidos ou números de processo.
 3. Captação ou mercantilização: "contrate", preço, gratuidade, desconto, urgência artificial (Prov. 205/2021, art. 3º, I).
 4. Comparação com outros escritórios ou autopromoção (art. 3º, IV).
 5. Sensacionalismo ou exploração de temas para atrair clientela.
 6. Afirmação jurídica sem fundamento indicado, ou com fundamento incorreto/desatualizado.
 7. Ausência da ressalva informativa na legenda.
 8. Caso concreto, decisão judicial ou resultado (arts. 4º §2º, 5º §3º, 6º). No pilar Casos Ilustrativos: ausência de "ilustrativo": true.
 9. Expressões persuasivas, de autoengrandecimento ou incitação direta ao litígio ou à contratação (art. 3º, IV e §1º).
10. Convite a consultas jurídicas individuais (comentários, direct, "mande sua dúvida").
11. Conteúdo que exponha, ridicularize ou estereotipe devedores (CDC, art. 42).
12. Uso de caso público noticiado: falta de fonte na legenda; opinião sobre o mérito ou sobre a atuação dos advogados das partes (Código de Ética, art. 42, II); adjetivos ou exposição da pessoa além do noticiado; estratégia apresentada como promessa ou como serviço do escritório; convite ao escritório (Prov. 205/2021, art. 3º, §1º). Estratégia apresentada em tese, com dispositivo, é permitida.
13. (Roteiros de vídeo) Conscientização que vira captação: fala ou texto na tela que convide a contratar, terceirizar ou "deixar com a gente", que compare a cobrança feita pela própria escola com o serviço do escritório de forma autopromocional, ou que use medo/urgência para empurrar a contratação (Prov. 205/2021, art. 3º, §1º). Mostrar riscos e a complexidade técnica da cobrança, com o fechamento genérico "Cada caso exige análise de um advogado especializado em recuperação de crédito", é PERMITIDO. Avalie também as falas como serão ditas em voz alta, o texto na tela e a capa.

GRAVIDADE de cada apontamento:
- "alta": viola regra ética ou contém erro jurídico → parecer não pode ser "aprovado".
- "media": risco relevante ou redação que pode ser lida como violação → "ajustar".
- "baixa": melhoria recomendada; não impede "aprovado".

PARECER:
- "bloquear": o tema ou a abordagem é incompatível com as regras, e ajuste de redação não resolve (ex.: pauta que exige divulgar resultado).
- "ajustar": há apontamento de gravidade alta ou média corrigível.
- "aprovado": apenas apontamentos de gravidade baixa, ou nenhum.

CONFERÊNCIA JURÍDICA: para cada afirmação jurídica da peça, informe o dispositivo citado, se ele sustenta a afirmação e sua confiança (alta/media/baixa). Confiança "media" ou "baixa" deve ser explicada — o advogado vai conferir.

Responda somente com o JSON no formato solicitado.`;

const SISTEMA_GLAUBER = `Você é Glauber, roteirista de Reels do Estúdio de Marketing da Palácio Gomes Advocacia, escritório especializado em gestão de inadimplência e recuperação de crédito para empresas, com atuação forte junto a escolas particulares. Quem aparece nos vídeos são os advogados João Pedro e Giovanna, gravando com celular no escritório.

PÚBLICO: diretor(a) ou mantenedor(a) de escola particular de pequeno e médio porte (principal); gestores de clínicas e empresas credoras (secundário). Nunca o devedor.

FORMATO DO VÍDEO: ESTUDO DE CASO A PARTIR DE UMA NOTÍCIA REAL. Não é vídeo de dicas. Estrutura obrigatória, nesta ordem (etapas):
1. "gancho" (3 a 5 s): a notícia, em uma frase forte e factual, citando o veículo e o mês ("Em outubro de 2026, o g1 noticiou que…"). Nunca use "esta semana", "ontem", "hoje", "recentemente": o vídeo será gravado e publicado até 6 semanas depois.
2. "problema": o que está em jogo para o CREDOR numa situação assim, e a ponte para a realidade da escola ("Agora troque o artista por uma família que deve seis mensalidades…").
3. "estrategia" (1 ou 2 blocos): os caminhos que a lei oferece EM TESE ao credor, com o dispositivo dito de forma natural ("o Código de Processo Civil, no artigo 854, permite…"). Mostre que cobrança bem feita exige técnica: prazos, prova, escolha do instrumento certo, limites do CDC (art. 42), prescrição.
4. "fechamento": conclusão que eleva a consciência do gestor sobre os riscos de conduzir a cobrança sem técnica, terminando com a frase exata: "Cada caso exige análise de um advogado especializado em recuperação de crédito."

OBJETIVO DE CONSCIÊNCIA: o vídeo deve levar o gestor a perceber, sozinho, que a cobrança envolve riscos (cobrança abusiva, prescrição, protesto ou negativação indevidos, LGPD, desgaste com as famílias, perda de prova) e técnica. Isso é PERMITIDO. É PROIBIDO dizer ou sugerir "contrate", "terceirize com a gente", "fale conosco", "nós resolvemos", comparar a escola com o escritório, prometer resultado ou usar medo para empurrar a contratação (Prov. 205/2021, art. 3º, §1º).

CASO PÚBLICO (regras inegociáveis): relate o fato só como noticiado, com veículo e mês; sem adjetivos sobre as pessoas; nunca opine sobre o mérito, sobre o devedor ou sobre a atuação dos advogados das partes (Código de Ética, art. 42, II); nunca diga que o escritório atua, atuaria ou atuou no caso; estratégia sempre "em tese". Nenhum caso do escritório, cliente, valor recuperado ou depoimento. Nunca exponha, ridicularize ou estereotipe devedores.

LINGUAGEM FALADA: frases curtas, ordem direta, uma ideia por frase, como se conversasse com um diretor na sala dele. Nada de juridiquês, siglas sem explicação, parênteses ou números de artigo em sequência. Escreva números por extenso quando soar melhor falado. Sem emojis.
APRESENTADORES: respeite o FORMATO informado. "joao" ou "giovanna": todas as falas com esse apresentador. "dupla": alterne entre "João" e "Giovanna" de forma natural (um apresenta o caso, o outro traz a estratégia, por exemplo), sem teatralizar.

TEMPO: cerca de 2,5 palavras por segundo. A soma de "segundos" dos blocos deve ficar próxima da DURAÇÃO informada (±5 s), e o total de palavras das falas não pode passar de 2,5 × duração.
CAMPOS DE CADA BLOCO:
- "fala": o texto exato a ser dito.
- "topicos": 2 a 4 tópicos curtos (até 8 palavras) para quem prefere falar com as próprias palavras.
- "texto_tela": legenda curta que aparece no vídeo, até 50 caracteres (ex.: "CPC, art. 854 · penhora on-line").
- "imagem": sugestão simples de enquadramento, gesto ou objeto em cena, gravável no escritório com celular.
CAPA (imagem 9:16 que a Tarsila monta): "kicker" até 40 caracteres (ex.: "Caso em pauta · Penhora de cachê"); "titulo" até 60 caracteres, com *ênfase* em 1 ou 2 palavras; sem nome da pessoa envolvida na capa.
URGÊNCIA: "postar_logo" se o interesse depende da notícia ainda estar em evidência; "atemporal" se a lição vale por meses.
LEGENDA: até 1.200 caracteres; parágrafos curtos; inclui "Fonte: <veículo>, <data>"; termina com "Conteúdo informativo. Cada caso exige análise própria." e 3 a 5 hashtags em minúsculas. Sem chamada para contratação.
PRECISÃO JURÍDICA: cite apenas dispositivos de que tem segurança; qualquer dúvida vai para "pontos_de_verificacao". Nunca invente artigo, súmula ou julgado; não cite número de processo.

QUANDO RECEBER PARECER DA TÊMIS: corrija exatamente os pontos apontados, mantendo o resto.

Responda somente com o JSON no formato solicitado.`;

/* ======================= FERRAMENTAS (saída estruturada) ======================= */
const FERRAMENTA_GLAUBER = {
  name: "entregar_roteiro",
  input_schema: {
    type: "object",
    required: ["capa", "blocos", "urgencia", "ilustrativo", "legenda", "pontos_de_verificacao"],
    properties: {
      capa: { type: "object", required: ["kicker", "titulo"], properties: { kicker: { type: "string" }, titulo: { type: "string" } } },
      blocos: { type: "array", items: { type: "object",
        required: ["etapa", "quem", "fala", "topicos", "segundos", "texto_tela", "imagem"],
        properties: {
          etapa: { type: "string", enum: ["gancho", "problema", "estrategia", "fechamento"] },
          quem: { type: "string", enum: ["João", "Giovanna"] },
          fala: { type: "string" }, topicos: { type: "array", items: { type: "string" } },
          segundos: { type: "integer" }, texto_tela: { type: "string" }, imagem: { type: "string" } } } },
      urgencia: { type: "string", enum: ["atemporal", "postar_logo"] },
      ilustrativo: { type: "boolean" },
      legenda: { type: "string" },
      pontos_de_verificacao: { type: "array", items: { type: "string" } },
    },
  },
};
const FECHO_REELS = "Cada caso exige análise de um advogado especializado em recuperação de crédito";
const palavras = (s: unknown) => String(s ?? "").trim().split(/\s+/).filter(Boolean).length;
function excessosReels(r: any, duracao: number, formato: string): string[] {
  const v: string[] = [];
  const n = (s: unknown) => String(s ?? "").replace(/\*+/g, "").length;
  if (n(r.capa?.kicker) > 40) v.push(`capa.kicker: ${n(r.capa?.kicker)} caracteres (máximo 40)`);
  if (n(r.capa?.titulo) > 60) v.push(`capa.titulo: ${n(r.capa?.titulo)} caracteres (máximo 60)`);
  const blocos = r.blocos || [];
  if (blocos.length < 4 || blocos.length > 8) v.push(`${blocos.length} blocos (use de 4 a 8)`);
  const total = blocos.reduce((a: number, b: any) => a + palavras(b.fala), 0);
  const maxPal = Math.round(duracao * 2.5);
  if (total > maxPal) v.push(`falas com ${total} palavras no total (máximo ${maxPal} para ${duracao} s)`);
  const seg = blocos.reduce((a: number, b: any) => a + (Number(b.segundos) || 0), 0);
  if (Math.abs(seg - duracao) > 5) v.push(`soma dos segundos = ${seg} (deve ficar entre ${duracao - 5} e ${duracao + 5})`);
  blocos.forEach((b: any, i: number) => { if (n(b.texto_tela) > 50) v.push(`bloco ${i + 1}.texto_tela: ${n(b.texto_tela)} caracteres (máximo 50)`); });
  if (blocos.length && blocos[0].etapa !== "gancho") v.push("o primeiro bloco deve ser o gancho");
  const ult = blocos[blocos.length - 1];
  if (ult && !String(ult.fala || "").includes(FECHO_REELS)) v.push(`a última fala deve terminar com "${FECHO_REELS}."`);
  const esperado = formato === "joao" ? "João" : formato === "giovanna" ? "Giovanna" : "";
  if (esperado && blocos.some((b: any) => b.quem !== esperado)) v.push(`todas as falas devem ser de ${esperado}`);
  if (formato === "dupla" && new Set(blocos.map((b: any) => b.quem)).size < 2) v.push("formato em dupla: as falas devem alternar entre João e Giovanna");
  if (/\b(esta semana|nesta semana|ontem|hoje)\b/i.test(blocos.map((b: any) => b.fala).join(" "))) v.push('evite "esta semana", "ontem" ou "hoje": o vídeo vai ao ar semanas depois');
  return v;
}
const NOMES_FORMATO: Record<string, string> = { joao: "só João", giovanna: "só Giovanna", dupla: "João e Giovanna (dupla)" };

const SLIDE: Record<string, unknown> = {
  lista: { type: "object", required: ["rotulo", "titulo", "itens"], properties: {
    rotulo: { type: "string" }, titulo: { type: "string" },
    itens: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } } },
  pergunta: { type: "object", required: ["rotulo", "pergunta", "resposta"], properties: {
    rotulo: { type: "string" }, pergunta: { type: "string" }, resposta: { type: "string" } } },
  mitofato: { type: "object", required: ["rotulo", "mito", "fato"], properties: {
    rotulo: { type: "string" }, mito: { type: "string" }, fato: { type: "string" } } },
};
const ferramentaClarice = (modelo: string) => ({
  name: "entregar_carrossel",
  description: "Entrega o carrossel pronto no formato da Tarsila.",
  input_schema: {
    type: "object",
    required: ["capa", "slides", "fechamento", "ilustrativo", "legenda", "pontos_de_verificacao"],
    properties: {
      capa: { type: "object", required: ["kicker", "titulo"], properties: { kicker: { type: "string" }, titulo: { type: "string" } } },
      slides: { type: "array", items: SLIDE[modelo], minItems: 2, maxItems: 4 },
      fechamento: { type: "object", required: ["rotulo", "titulo", "texto"], properties: {
        rotulo: { type: "string" }, titulo: { type: "string" }, texto: { type: "string" } } },
      ilustrativo: { type: "boolean" },
      legenda: { type: "string" },
      pontos_de_verificacao: { type: "array", items: { type: "string" },
        description: "Afirmações jurídicas que o advogado deve conferir antes de publicar (pode ser vazio)." },
    },
  },
});
const FERRAMENTA_TEMIS = {
  name: "emitir_parecer",
  description: "Emite o parecer de conformidade da peça.",
  input_schema: {
    type: "object",
    required: ["parecer", "resumo", "apontamentos", "conferencia_juridica"],
    properties: {
      parecer: { type: "string", enum: ["aprovado", "ajustar", "bloquear"] },
      resumo: { type: "string", description: "Uma ou duas frases para o advogado." },
      apontamentos: { type: "array", items: { type: "object",
        required: ["criterio", "onde", "trecho", "problema", "sugestao", "gravidade"],
        properties: {
          criterio: { type: "integer", minimum: 1, maximum: 13 },
          onde: { type: "string", description: "Ex.: capa, slide 3, fechamento, legenda" },
          trecho: { type: "string" }, problema: { type: "string" }, sugestao: { type: "string" },
          gravidade: { type: "string", enum: ["alta", "media", "baixa"] } } } },
      conferencia_juridica: { type: "array", items: { type: "object",
        required: ["afirmacao", "dispositivo", "sustenta", "confianca", "observacao"],
        properties: {
          afirmacao: { type: "string" }, dispositivo: { type: "string" }, sustenta: { type: "boolean" },
          confianca: { type: "string", enum: ["alta", "media", "baixa"] }, observacao: { type: "string" } } } },
    },
  },
};

// Saída estruturada exige additionalProperties:false e não aceita limites numéricos/de tamanho
function estrito(s: any): any {
  if (Array.isArray(s)) return s.map(estrito);
  if (!s || typeof s !== "object") return s;
  const o: any = {};
  for (const [k, v] of Object.entries(s)) {
    if (["minItems", "maxItems", "minimum", "maximum", "minLength", "maxLength"].includes(k)) continue;
    o[k] = estrito(v);
  }
  if (o.type === "object") o.additionalProperties = false;
  return o;
}

// Limites de caracteres (sem contar asteriscos) para o texto caber no slide
const LIMITES: Record<string, Record<string, number>> = {
  lista: { rotulo: 40, titulo: 24, item: 88 },
  pergunta: { rotulo: 40, pergunta: 80, resposta: 260 },
  mitofato: { rotulo: 40, mito: 110, fato: 170 },
};
function excessos(r: any, modelo: string): string[] {
  const n = (s: unknown) => String(s ?? "").replace(/\*+/g, "").length;
  const v: string[] = [];
  const chk = (onde: string, s: unknown, max: number) => { if (n(s) > max) v.push(`${onde}: ${n(s)} caracteres (máximo ${max})`); };
  chk("capa.kicker", r.capa?.kicker, 45); chk("capa.titulo", r.capa?.titulo, 75);
  const L = LIMITES[modelo];
  (r.slides || []).forEach((s: any, i: number) => {
    const o = `slide ${i + 2}`;
    chk(`${o}.rotulo`, s.rotulo, L.rotulo);
    if (modelo === "lista") {
      chk(`${o}.titulo`, s.titulo, L.titulo);
      if ((s.itens || []).length > 3) v.push(`${o}: ${s.itens.length} itens (máximo 3)`);
      (s.itens || []).forEach((it: string, j: number) => chk(`${o}.item ${j + 1}`, it, L.item));
    } else if (modelo === "pergunta") { chk(`${o}.pergunta`, s.pergunta, L.pergunta); chk(`${o}.resposta`, s.resposta, L.resposta); }
    else { chk(`${o}.mito`, s.mito, L.mito); chk(`${o}.fato`, s.fato, L.fato); }
  });
  chk("fechamento.rotulo", r.fechamento?.rotulo, 40); chk("fechamento.titulo", r.fechamento?.titulo, 45);
  chk("fechamento.texto", r.fechamento?.texto, 160); chk("legenda", r.legenda, 1400);
  return v;
}

const NOMES_MODELO: Record<string, string> = { lista: "LISTA", pergunta: "PERGUNTA", mitofato: "MITOFATO" };

/* ======================= HANDLER ======================= */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);

  const URL_SB = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(URL_SB, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1) Quem chama precisa ser membro da equipe
  const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
  const { data: u } = await admin.auth.getUser(token);
  if (!u?.user) return json({ erro: "Sessão inválida. Entre novamente." }, 401);
  const { data: perfil } = await admin.from("perfis").select("id").eq("id", u.user.id).maybeSingle();
  if (!perfil) return json({ erro: "Usuário sem acesso ao Estúdio." }, 403);

  let corpo: { agente?: string; peca_id?: string };
  try { corpo = await req.json(); } catch { return json({ erro: "Requisição inválida." }, 400); }
  const agente = corpo.agente || "";
  if (!MODELOS[agente] || !corpo.peca_id) return json({ erro: "Informe agente (clarice|glauber|temis) e peca_id." }, 400);

  const CHAVE = Deno.env.get("ANTHROPIC_API_KEY");
  if (!CHAVE) return json({ erro: "A chave da API da Anthropic ainda não foi cadastrada no Supabase." }, 503);

  // 2) Teto de custo do mês
  const [{ data: gasto }, { data: cfg }] = await Promise.all([
    admin.rpc("custo_mes"),
    admin.from("config").select("valor").eq("chave", "teto_mensal_usd").maybeSingle(),
  ]);
  const teto = Number(cfg?.valor ?? 12);
  if (Number(gasto ?? 0) >= teto) {
    await admin.from("agente_execucoes").insert({ agente, peca_id: corpo.peca_id, status: "bloqueado_teto",
      erro: `Teto mensal de US$ ${teto} atingido.` });
    return json({ erro: `Teto mensal de US$ ${teto} atingido. Os agentes estão pausados até o próximo mês (ou até o teto ser aumentado).` }, 402);
  }

  // 3) Peça + aprendizados
  const { data: peca } = await admin.from("pecas").select("*").eq("id", corpo.peca_id).maybeSingle();
  if (!peca) return json({ erro: "Peça não encontrada." }, 404);
  const { data: regras } = await admin.from("aprendizados").select("regra")
    .eq("ativo", true).in("agente", [agente, "todas"]).order("criado_em");
  const { data: cfgEstilo } = await admin.from("config").select("valor").eq("chave", "estilo_joao").maybeSingle();
  const estilo = agente !== "temis" && cfgEstilo?.valor
    ? `\n\nESTILO DO ADVOGADO (imite o tom: perguntas que puxam o leitor, analogias do dia a dia, contrastes claros, frases curtas; nunca copie trechos):\n«${String(cfgEstilo.valor).slice(0, 3000)}»`
    : "";
  const extra = (regras || []).length
    ? `\n\nREGRAS DEFINIDAS PELO ADVOGADO (têm prioridade):\n${regras!.map((r, i) => `${i + 1}. ${r.regra}`).join("\n")}`
    : "";

  // 4) Monta a chamada
  const M = MODELOS[agente];
  let sistema: string, mensagem: string, ferramenta: Record<string, unknown>;
  if (agente === "clarice") {
    sistema = SISTEMA_CLARICE + estilo + extra;
    ferramenta = ferramentaClarice(peca.modelo);
    const temParecer = peca.parecer && peca.parecer.parecer === "ajustar" && peca.conteudo?.capa;
    mensagem = `MODELO DE CARROSSEL: ${NOMES_MODELO[peca.modelo]}
PILAR: ${peca.pilar || "Gestão de Inadimplência"}
TEMA: ${peca.tema}
${peca.observacoes ? `OBSERVAÇÕES DO ADVOGADO: ${peca.observacoes}\n` : ""}` +
      (temParecer
        ? `\nVERSÃO ATUAL (corrija conforme o parecer):\n${JSON.stringify({ ...peca.conteudo, legenda: peca.legenda })}\n\nPARECER DA TÊMIS:\n${JSON.stringify(peca.parecer)}`
        : "\nEscreva o carrossel.");
  } else if (agente === "glauber") {
    sistema = SISTEMA_GLAUBER + estilo + extra;
    ferramenta = FERRAMENTA_GLAUBER;
    const temParecer = peca.parecer && peca.parecer.parecer === "ajustar" && peca.conteudo?.blocos;
    const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    mensagem = `HOJE: ${hoje}
FORMATO: ${NOMES_FORMATO[peca.formato || "joao"]}
DURAÇÃO: ${peca.duracao || 45} segundos
TEMA: ${peca.tema}
${peca.observacoes ? `NOTÍCIA E ORIENTAÇÕES:\n${peca.observacoes}\n` : ""}` +
      (temParecer
        ? `\nVERSÃO ATUAL (corrija conforme o parecer):\n${JSON.stringify({ ...peca.conteudo, legenda: peca.legenda })}\n\nPARECER DA TÊMIS:\n${JSON.stringify(peca.parecer)}`
        : "\nEscreva o roteiro.");
  } else if (peca.modelo === "reels") {
    sistema = SISTEMA_TEMIS + extra;
    ferramenta = FERRAMENTA_TEMIS;
    const c = peca.conteudo || {};
    const roteiro = (c.blocos || []).map((b: any, i: number) =>
      `[${i + 1} · ${b.etapa} · ${b.quem} · ${b.segundos}s]\nFALA: ${b.fala}\nTEXTO NA TELA: ${b.texto_tela}\nIMAGEM: ${b.imagem}`).join("\n\n");
    mensagem = `TIPO: ROTEIRO DE REELS (vídeo falado; aplique também o item 13)\nFORMATO: ${NOMES_FORMATO[peca.formato || "joao"]} · ${peca.duracao || 45} s\nTEMA: ${peca.tema || "-"}\n${peca.observacoes ? `NOTÍCIA DE BASE E ORIENTAÇÕES:\n${peca.observacoes}\n` : ""}\nCAPA: ${c.capa?.kicker || ""} — ${c.capa?.titulo || ""}\n\nROTEIRO A REVISAR:\n${roteiro}\n\nLEGENDA:\n${peca.legenda || "(sem legenda)"}\n\nNo campo "onde", use "capa", "bloco N" ou "legenda".`;
  } else {
    sistema = SISTEMA_TEMIS + extra;
    ferramenta = FERRAMENTA_TEMIS;
    mensagem = `PILAR: ${peca.pilar || "-"}\nMODELO: ${NOMES_MODELO[peca.modelo]}\nTEMA: ${peca.tema || "-"}\n\nPEÇA A REVISAR:\n${JSON.stringify(peca.conteudo)}\n\nLEGENDA:\n${peca.legenda || "(sem legenda)"}`;
  }

  const schema = estrito((ferramenta as { input_schema: unknown }).input_schema);
  async function chamar(msg: string): Promise<{ r: any; falha: string; status: number }> {
    const inicio = Date.now();
    let resp: Response;
    try {
      resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": CHAVE!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: M.id, max_tokens: 8000, system: sistema,
          output_config: { format: { type: "json_schema", schema } },
          messages: [{ role: "user", content: msg }] }),
      });
    } catch (e) {
      await admin.from("agente_execucoes").insert({ agente, peca_id: peca.id, modelo: M.id, status: "erro",
        erro: "Falha de rede: " + String(e), duracao_ms: Date.now() - inicio });
      return { r: null, falha: "Não foi possível falar com a API da Anthropic.", status: 502 };
    }
    const dados = await resp.json();
    const duracao = Date.now() - inicio;
    const uso = dados.usage || {};
    const custo = ((uso.input_tokens || 0) * M.entrada + (uso.output_tokens || 0) * M.saida) / 1e6;
    if (!resp.ok) {
      await admin.from("agente_execucoes").insert({ agente, peca_id: peca.id, modelo: M.id, status: "erro",
        erro: JSON.stringify(dados).slice(0, 500), duracao_ms: duracao });
      return { r: null, falha: "A API da Anthropic recusou a chamada: " + (dados?.error?.message || resp.status), status: 502 };
    }
    const texto = (dados.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
    let r: any = null, falha = "";
    if (dados.stop_reason === "refusal") falha = "A agente recusou a tarefa.";
    else if (dados.stop_reason === "max_tokens") falha = "Resposta cortada por tamanho.";
    else { try { r = JSON.parse(texto); } catch { falha = "Resposta fora do formato JSON."; } }
    await admin.from("agente_execucoes").insert({ agente, peca_id: peca.id, modelo: M.id, status: r ? "ok" : "erro",
      tokens_entrada: uso.input_tokens || 0, tokens_saida: uso.output_tokens || 0, custo_usd: custo,
      duracao_ms: duracao, erro: r ? null : falha });
    return { r, falha: r ? "" : falha + " Tente novamente.", status: 502 };
  }

  let { r, falha, status: st } = await chamar(mensagem);
  if (!r) return json({ erro: falha }, st);
  // Clarice: se passou dos limites de tamanho, uma correção automática
  if (agente === "clarice" || agente === "glauber") {
    const v = agente === "clarice" ? excessos(r, peca.modelo) : excessosReels(r, peca.duracao || 45, peca.formato || "joao");
    if (v.length) {
      const segunda = await chamar(mensagem + `\n\nSUA VERSÃO ANTERIOR:\n${JSON.stringify(r)}\n\nELA NÃO RESPEITOU AS REGRAS DE FORMATO:\n- ${v.join("\n- ")}\n\nReescreva encurtando APENAS esses campos, mantendo o restante e o sentido.`);
      if (segunda.r) r = segunda.r;
    }
  }
  if (agente === "temis") {
    r.parecer = String(r.parecer || "").toLowerCase();
    (r.apontamentos || []).forEach((a: any) => { a.gravidade = String(a.gravidade || "").toLowerCase(); });
    (r.conferencia_juridica || []).forEach((c: any) => { c.confianca = String(c.confianca || "").toLowerCase(); });
  }

  // 5) Grava o resultado
  if (agente === "clarice" || agente === "glauber") {
    const { legenda, pontos_de_verificacao, ...conteudo } = r;
    const versao = peca.conteudo?.capa ? (peca.versao || 1) + 1 : 1;
    const pontos: string[] = [...(pontos_de_verificacao || [])];
    // Glauber: o que ainda ficou fora do formato vai para a conferência do advogado
    if (agente === "glauber") pontos.push(...excessosReels(r, peca.duracao || 45, peca.formato || "joao").map((x) => "Formato: " + x));
    await admin.from("pecas").update({
      conteudo, legenda, pontos_verificacao: pontos,
      titulo: String(conteudo.capa?.titulo || peca.tema || "Sem título").replace(/\*+/g, "").slice(0, 200),
      status: "em_revisao", versao,
    }).eq("id", peca.id);
    return json({ ok: true, agente, versao });
  } else {
    // Regra dura: apontamento de gravidade alta nunca deixa passar como "aprovado"
    if (r.parecer === "aprovado" && (r.apontamentos || []).some((a: { gravidade: string }) => a.gravidade === "alta")) {
      r.parecer = "ajustar";
    }
    const registro = { ...r, versao: peca.versao, data: new Date().toISOString() };
    const status = r.parecer === "bloquear" ? "bloqueada" : r.parecer === "aprovado" ? "aguardando_voce" : "em_revisao";
    await admin.from("pecas").update({
      parecer: registro, historico: [...(peca.historico || []), registro], status,
    }).eq("id", peca.id);
    return json({ ok: true, agente, parecer: r.parecer });
  }
});
