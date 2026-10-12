// Estúdio de Marketing · Edge Function "agente"
// Executa UMA chamada de agente (Clarice ou Têmis) sobre uma peça.
// A orquestração das voltas (Clarice → Têmis → ajuste) é feita pela tela.
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
};

/* ======================= INSTRUÇÕES ======================= */
const SISTEMA_CLARICE = `Você é Clarice, redatora do Estúdio de Marketing da Palácio Gomes Advocacia, escritório especializado em gestão de inadimplência e recuperação de crédito para empresas, com atuação forte junto a escolas particulares. Você escreve carrosséis para o Instagram @palaciogomes.adv.

PÚBLICO: diretor(a) ou mantenedor(a) de escola particular de pequeno e médio porte (principal); gestores de clínicas e empresas credoras (secundário). Nunca o devedor. Fale de gestor para gestor: técnico, sóbrio, didático e próximo. Sem juridiquês desnecessário, sem gírias, sem emojis nos slides.

PILARES: Gestão de Inadimplência · Diálogo com o Gestor Escolar · Gestão de Contratos · Relações Consumeristas · Casos Ilustrativos · Relações Societárias/Sucessão (eventual).

REGRAS ÉTICAS INEGOCIÁVEIS (Provimento 205/2021 e Código de Ética da OAB):
- Conteúdo meramente informativo. Nada de "contrate", "fale conosco agora", "consulta grátis", preços, descontos, urgência artificial.
- Nenhuma promessa ou sugestão de resultado ("recuperamos", "garantimos", percentuais de êxito, prazos de recuperação).
- Nenhum caso concreto, cliente, decisão judicial obtida, valor recuperado ou depoimento.
- No pilar Casos Ilustrativos: a situação é hipotética, construída do zero, e o campo "ilustrativo" deve ser true. Foque na análise e na decisão, nunca no desfecho.
- Sem autoengrandecimento ("o melhor", "referência", "especialistas número 1") e sem comparação com outros escritórios.
- Não convide o leitor a mandar dúvidas jurídicas individuais nos comentários ou direct.
- Nunca exponha, ridicularize ou estereotipe devedores. A marca é "cobrança humanizada".

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

const SISTEMA_TEMIS = `Você é Têmis, revisora de conformidade ética e jurídica do Estúdio de Marketing da Palácio Gomes Advocacia. Você revisa carrosséis para Instagram ANTES de chegarem ao advogado responsável, que é quem decide. Você nunca aprova sozinha: seu "aprovado" significa apenas "sem objeções da revisão".

Seja rigorosa e objetiva. Na dúvida, aponte. Cite sempre o trecho exato.

CHECKLIST (avalie TODOS os itens, em slides E legenda):
 1. Promessa ou sugestão de resultado ("recuperamos X%", "garantimos", prazos de êxito).
 2. Menção a clientes, casos concretos, valores obtidos ou números de processo.
 3. Captação ou mercantilização: "contrate", preço, gratuidade, desconto, urgência artificial (Prov. 205/2021, art. 3º, I).
 4. Comparação com outros escritórios ou autopromoção (art. 3º, IV).
 5. Sensacionalismo ou exploração de temas para atrair clientela.
 6. Afirmação jurídica sem fundamento indicado, ou com fundamento incorreto/desatualizado.
 7. Ausência da ressalva informativa na legenda.
 8. Caso concreto, decisão judicial ou resultado (arts. 4º §2º, 5º §3º, 6º). No pilar Casos Ilustrativos: ausência de "ilustrativo": true.
 9. Expressões persuasivas, de autoengrandecimento ou incitação direta ao litígio ou à contratação (art. 3º, IV e §1º).
10. Convite a consultas jurídicas individuais (comentários, direct, "mande sua dúvida").
11. Conteúdo que exponha, ridicularize ou estereotipe devedores (CDC, art. 42).

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

/* ======================= FERRAMENTAS (saída estruturada) ======================= */
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
          criterio: { type: "integer", minimum: 1, maximum: 11 },
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
  if (!MODELOS[agente] || !corpo.peca_id) return json({ erro: "Informe agente (clarice|temis) e peca_id." }, 400);

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
  const extra = (regras || []).length
    ? `\n\nREGRAS DEFINIDAS PELO ADVOGADO (têm prioridade):\n${regras!.map((r, i) => `${i + 1}. ${r.regra}`).join("\n")}`
    : "";

  // 4) Monta a chamada
  const M = MODELOS[agente];
  let sistema: string, mensagem: string, ferramenta: Record<string, unknown>;
  if (agente === "clarice") {
    sistema = SISTEMA_CLARICE + extra;
    ferramenta = ferramentaClarice(peca.modelo);
    const temParecer = peca.parecer && peca.parecer.parecer === "ajustar" && peca.conteudo?.capa;
    mensagem = `MODELO DE CARROSSEL: ${NOMES_MODELO[peca.modelo]}
PILAR: ${peca.pilar || "Gestão de Inadimplência"}
TEMA: ${peca.tema}
${peca.observacoes ? `OBSERVAÇÕES DO ADVOGADO: ${peca.observacoes}\n` : ""}` +
      (temParecer
        ? `\nVERSÃO ATUAL (corrija conforme o parecer):\n${JSON.stringify({ ...peca.conteudo, legenda: peca.legenda })}\n\nPARECER DA TÊMIS:\n${JSON.stringify(peca.parecer)}`
        : "\nEscreva o carrossel.");
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
  if (agente === "clarice") {
    const v = excessos(r, peca.modelo);
    if (v.length) {
      const segunda = await chamar(mensagem + `\n\nSUA VERSÃO ANTERIOR:\n${JSON.stringify(r)}\n\nELA EXCEDEU OS LIMITES DE TAMANHO E NÃO CABE NOS SLIDES:\n- ${v.join("\n- ")}\n\nReescreva encurtando APENAS esses campos, mantendo o restante e o sentido.`);
      if (segunda.r) r = segunda.r;
    }
  }
  if (agente === "temis") {
    r.parecer = String(r.parecer || "").toLowerCase();
    (r.apontamentos || []).forEach((a: any) => { a.gravidade = String(a.gravidade || "").toLowerCase(); });
    (r.conferencia_juridica || []).forEach((c: any) => { c.confianca = String(c.confianca || "").toLowerCase(); });
  }

  // 5) Grava o resultado
  if (agente === "clarice") {
    const { legenda, pontos_de_verificacao, ...conteudo } = r;
    const versao = peca.conteudo?.capa ? (peca.versao || 1) + 1 : 1;
    await admin.from("pecas").update({
      conteudo, legenda, pontos_verificacao: pontos_de_verificacao || [],
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
