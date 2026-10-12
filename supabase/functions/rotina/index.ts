// Estúdio de Marketing · Edge Function "rotina"
// Tarefas agendadas: pauta semanal (Atena) e briefing diário (Péricles).
// Chamada pelo agendador (cabeçalho x-cron-secret) ou pela tela (usuário logado).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MODELOS = {
  atena: { id: "claude-sonnet-5-5", entrada: 2, saida: 10 },
  pericles: { id: "claude-haiku-5-5", entrada: 0.10, saida: 0.50 },
};

/* ---------- datas no fuso de São Paulo ---------- */
function hojeSP(): Date {
  const s = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(s);
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function segundaDaSemana(d: Date): Date {
  const x = new Date(d); const dia = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dia); return x;
}
const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/* ---------- instruções ---------- */
const SISTEMA_ATENA = `Você é Atena, estrategista de conteúdo do Estúdio de Marketing da Palácio Gomes Advocacia, escritório especializado em gestão de inadimplência e recuperação de crédito para empresas, com atuação forte junto a escolas particulares. Você monta a pauta semanal de posts do Instagram @palaciogomes.adv.

PÚBLICO: diretor(a) ou mantenedor(a) de escola particular de pequeno e médio porte (principal); gestores de clínicas e empresas credoras (secundário). Nunca o devedor.

PILARES (use exatamente estes nomes): Gestão de Inadimplência · Diálogo com o Gestor Escolar · Gestão de Contratos · Relações Consumeristas · Casos Ilustrativos · Relações Societárias e Sucessão (eventual, no máximo 1 a cada mês).

MODELOS DE CARROSSEL: "lista" (3 tópicos por slide), "pergunta" (pergunta e resposta), "mitofato" (mito × fato). Varie os modelos ao longo das semanas.

COMO PENSAR A PAUTA:
- Conecte o tema ao momento do calendário escolar e da gestão (ex.: rematrícula e reajuste de mensalidades no fim do ano; volta às aulas e matrículas no início do ano; meio de ano e férias de julho; fechamento de semestre; planejamento orçamentário). Use a data informada.
- Cada pauta resolve uma dúvida ou decisão real do diretor, em linguagem de gestão.
- Não repita temas já publicados ou em produção recentemente (lista fornecida). Evite pautas descartadas.
- Equilibre os pilares; Gestão de Inadimplência é o carro-chefe, mas não deve ocupar todas as vagas.
- Casos Ilustrativos: sempre situação hipotética, focada na análise e na decisão, nunca em desfecho.

REGRAS ÉTICAS (Provimento 205/2021): pautas meramente informativas. Nunca proponha divulgar resultados, clientes, casos concretos, valores recuperados, depoimentos, preços, gratuidade ou chamadas para contratação.

"angulo": a abordagem específica em uma frase (o que torna o post útil e não genérico).
"justificativa": por que agora, em uma frase.
"dia_sugerido": um dia útil da semana.

Responda somente com o JSON no formato solicitado.`;

const SISTEMA_PERICLES = `Você é Péricles, gestor do Estúdio de Marketing da Palácio Gomes Advocacia. Toda manhã você escreve ao advogado João Pedro um resumo curto do que precisa da decisão dele hoje.

Regras: português do Brasil, tom direto e cordial, no máximo 5 frases curtas, sem listas, sem emojis, sem cumprimentos longos. Comece pelo que é mais urgente (peças aguardando aprovação, bloqueios, pauta da semana a aprovar). Se não houver nada pendente, diga isso em uma frase. Não invente dados: use apenas os números fornecidos.`;

const SCHEMA_ATENA = {
  type: "object", additionalProperties: false,
  required: ["resumo_semana", "pautas"],
  properties: {
    resumo_semana: { type: "string" },
    pautas: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["tema", "modelo", "pilar", "angulo", "justificativa", "dia_sugerido"],
      properties: {
        tema: { type: "string" },
        modelo: { type: "string", enum: ["lista", "pergunta", "mitofato"] },
        pilar: { type: "string", enum: ["Gestão de Inadimplência", "Diálogo com o Gestor Escolar", "Gestão de Contratos",
          "Relações Consumeristas", "Casos Ilustrativos", "Relações Societárias e Sucessão"] },
        angulo: { type: "string" }, justificativa: { type: "string" }, dia_sugerido: { type: "string" },
      } } },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "Método não permitido." }, 405);
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // 1) Autorização: agendador (segredo) ou membro logado
  const segredo = req.headers.get("x-cron-secret");
  let origem = "";
  if (segredo) {
    const { data: ok } = await admin.rpc("segredo_cron_valido", { s: segredo });
    if (ok) origem = "agendador";
  } else {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: u } = await admin.auth.getUser(token);
    if (u?.user) {
      const { data: p } = await admin.from("perfis").select("id").eq("id", u.user.id).maybeSingle();
      if (p) origem = "manual";
    }
  }
  if (!origem) return json({ erro: "Não autorizado." }, 401);

  let corpo: { tarefa?: string; forcar?: boolean };
  try { corpo = await req.json(); } catch { return json({ erro: "Requisição inválida." }, 400); }
  const CHAVE = Deno.env.get("ANTHROPIC_API_KEY");
  if (!CHAVE) return json({ erro: "Chave da API não cadastrada." }, 503);

  const hoje = hojeSP(), segunda = segundaDaSemana(hoje), semana = iso(segunda);
  const { data: cfgs } = await admin.from("config").select("chave,valor");
  const cfg = Object.fromEntries((cfgs || []).map((c) => [c.chave, Number(c.valor)]));
  const teto = cfg.teto_mensal_usd || 12;
  const { data: gasto } = await admin.rpc("custo_mes");

  async function chamar(agente: "atena" | "pericles", sistema: string, msg: string, schema?: unknown) {
    const M = MODELOS[agente];
    if (Number(gasto ?? 0) >= teto) {
      await admin.from("agente_execucoes").insert({ agente, status: "bloqueado_teto", erro: `Teto de US$ ${teto} atingido.` });
      return { r: null, falha: `Teto mensal de US$ ${teto} atingido.` };
    }
    const inicio = Date.now();
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": CHAVE!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: M.id, max_tokens: agente === "atena" ? 8000 : 1500, system: sistema,
          ...(schema ? { output_config: { format: { type: "json_schema", schema } } } : {}),
          messages: [{ role: "user", content: msg }] }),
      });
      const d = await resp.json();
      const uso = d.usage || {};
      const custo = ((uso.input_tokens || 0) * M.entrada + (uso.output_tokens || 0) * M.saida) / 1e6;
      const texto = (d.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
      let r: any = null, falha = "";
      if (!resp.ok) falha = "API: " + (d?.error?.message || resp.status);
      else if (d.stop_reason === "refusal" || d.stop_reason === "max_tokens") falha = "Resposta incompleta (" + d.stop_reason + ").";
      else if (schema) { try { r = JSON.parse(texto); } catch { falha = "Resposta fora do formato."; } }
      else r = texto.trim();
      await admin.from("agente_execucoes").insert({ agente, modelo: M.id, status: r ? "ok" : "erro",
        tokens_entrada: uso.input_tokens || 0, tokens_saida: uso.output_tokens || 0, custo_usd: custo,
        duracao_ms: Date.now() - inicio, erro: r ? null : falha });
      return { r, falha };
    } catch (e) {
      await admin.from("agente_execucoes").insert({ agente, modelo: M.id, status: "erro", erro: "Rede: " + String(e), duracao_ms: Date.now() - inicio });
      return { r: null, falha: "Falha de rede." };
    }
  }

  /* =============== PAUTA SEMANAL (ATENA) =============== */
  if (corpo.tarefa === "pauta_semanal") {
    const { data: existentes } = await admin.from("pautas").select("id,status").eq("semana", semana);
    const abertas = (existentes || []).filter((p) => p.status === "proposta");
    if ((existentes || []).length && !corpo.forcar)
      return json({ ok: true, aviso: "A pauta desta semana já existe.", semana });
    if (abertas.length) await admin.from("pautas").update({ status: "descartada" }).in("id", abertas.map((p) => p.id));

    const n = (cfg.posts_por_semana || 2) + 1;
    const [{ data: recentes }, { data: descartadas }, { data: regras }] = await Promise.all([
      admin.from("pecas").select("titulo,pilar,modelo,status,criado_em").neq("status", "rejeitada").order("criado_em", { ascending: false }).limit(15),
      admin.from("pautas").select("tema").eq("status", "descartada").order("criado_em", { ascending: false }).limit(10),
      admin.from("aprendizados").select("regra").eq("ativo", true).in("agente", ["atena", "todas"]),
    ]);
    const msg = `HOJE: ${DIAS[hoje.getDay()]}, ${hoje.toLocaleDateString("pt-BR")}. SEMANA QUE COMEÇA EM: ${segunda.toLocaleDateString("pt-BR")}.
PUBLICAÇÕES POR SEMANA: ${n - 1}. Proponha ${n} pautas (uma é reserva), em ordem de prioridade.

PEÇAS RECENTES (não repetir):
${(recentes || []).map((p) => `- ${p.titulo} [${p.pilar || "-"} · ${p.modelo} · ${p.status}]`).join("\n") || "- nenhuma"}

PAUTAS DESCARTADAS PELO ADVOGADO (evitar):
${(descartadas || []).map((p) => `- ${p.tema}`).join("\n") || "- nenhuma"}
${(regras || []).length ? `\nREGRAS DO ADVOGADO:\n${regras!.map((r) => `- ${r.regra}`).join("\n")}` : ""}`;
    const { r, falha } = await chamar("atena", SISTEMA_ATENA, msg, SCHEMA_ATENA);
    if (!r) return json({ erro: "Atena: " + falha }, 502);
    const linhas = (r.pautas || []).slice(0, n).map((p: any, i: number) => ({ ...p, semana, ordem: i + 1 }));
    const { error } = await admin.from("pautas").insert(linhas);
    if (error) return json({ erro: "Falha ao gravar a pauta: " + error.message }, 500);
    return json({ ok: true, semana, pautas: linhas.length, resumo: r.resumo_semana, origem });
  }

  /* =============== BRIEFING (PÉRICLES) =============== */
  if (corpo.tarefa === "briefing") {
    const [{ data: aguardando }, { data: bloqueadas }, { data: aprovadas }, { data: publicadas }, { data: pautasSemana }, { data: gastoAgora }] = await Promise.all([
      admin.from("pecas").select("id,titulo,atualizado_em").eq("status", "aguardando_voce").order("atualizado_em"),
      admin.from("pecas").select("id,titulo").eq("status", "bloqueada"),
      admin.from("pecas").select("id,titulo").eq("status", "aprovada"),
      admin.from("pecas").select("id").eq("status", "publicada").gte("atualizado_em", semana),
      admin.from("pautas").select("id,tema,status,dia_sugerido").eq("semana", semana).order("ordem"),
      admin.rpc("custo_mes"),
    ]);
    const meta = cfg.posts_por_semana || 2;
    const dados = {
      data: iso(hoje), semana,
      aguardando: (aguardando || []).map((p) => ({ id: p.id, titulo: p.titulo })),
      bloqueadas: (bloqueadas || []).map((p) => ({ id: p.id, titulo: p.titulo })),
      aprovadas_nao_publicadas: (aprovadas || []).map((p) => ({ id: p.id, titulo: p.titulo })),
      publicadas_semana: (publicadas || []).length, meta_semana: meta,
      pautas_propostas: (pautasSemana || []).filter((p) => p.status === "proposta").length,
      pautas_aprovadas: (pautasSemana || []).filter((p) => ["aprovada", "produzida"].includes(p.status)).length,
      consumo_usd: Number(gastoAgora ?? 0), teto_usd: teto,
    };
    const msg = `Dados de hoje (${DIAS[hoje.getDay()]}, ${hoje.toLocaleDateString("pt-BR")}):
- Peças aguardando aprovação: ${dados.aguardando.length}${dados.aguardando.length ? " (" + dados.aguardando.map((p) => p.titulo).join("; ") + ")" : ""}
- Peças bloqueadas pela Têmis: ${dados.bloqueadas.length}
- Aprovadas e ainda não publicadas: ${dados.aprovadas_nao_publicadas.length}
- Publicadas nesta semana: ${dados.publicadas_semana} de ${meta}
- Pautas da semana aguardando aprovação: ${dados.pautas_propostas} (já aprovadas: ${dados.pautas_aprovadas})
- Consumo de IA no mês: US$ ${dados.consumo_usd.toFixed(2)} de US$ ${teto}`;
    const { r } = await chamar("pericles", SISTEMA_PERICLES, msg);
    const resumo = r || "Não consegui redigir o resumo hoje; os números abaixo estão atualizados.";
    await admin.from("briefings").upsert({ data: dados.data, resumo, dados }, { onConflict: "data" });
    return json({ ok: true, data: dados.data, resumo, origem });
  }

  return json({ erro: "Tarefa desconhecida." }, 400);
});
