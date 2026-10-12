// Estúdio de Marketing · Edge Function "rotina"
// Tarefas agendadas: pauta semanal (Atena), briefing diário (Péricles) e Radar (Rondon).
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
  rondon: { id: "claude-sonnet-5-5", entrada: 2, saida: 10 },
  rondon_extrator: { id: "claude-haiku-5-5", entrada: 0.10, saida: 0.50 },
};
const PRECO_BUSCA = 0.01; // US$ por busca na web

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

PILARES (use exatamente estes nomes): Gestão de Inadimplência · Diálogo com o Gestor Escolar · Gestão de Contratos · Relações Consumeristas · Casos Ilustrativos · Casos em Pauta (notícias reais da semana) · Relações Societárias e Sucessão (eventual, no máximo 1 a cada mês).

MODELOS DE CARROSSEL: "lista" (3 tópicos por slide), "pergunta" (pergunta e resposta), "mitofato" (mito × fato). Varie os modelos ao longo das semanas.

COMO PENSAR A PAUTA:
- Conecte o tema ao momento do calendário escolar e da gestão (ex.: rematrícula e reajuste de mensalidades no fim do ano; volta às aulas e matrículas no início do ano; meio de ano e férias de julho; fechamento de semestre; planejamento orçamentário). Use a data informada.
- Cada pauta resolve uma dúvida ou decisão real do diretor, em linguagem de gestão.
- Não repita temas já publicados ou em produção recentemente (lista fornecida). Evite pautas descartadas.
- Equilibre os pilares; Gestão de Inadimplência é o carro-chefe, mas não deve ocupar todas as vagas.
- Casos Ilustrativos: sempre situação hipotética, focada na análise e na decisão, nunca em desfecho.

RADAR DA SEMANA: você recebe as notícias levantadas pelo Rondon (com id). Sempre que houver item relevante, pelo menos uma pauta deve partir dele, com o pilar "Casos em Pauta" (caso público ou setor) ou o pilar adequado (números e índices), informando o "radar_id". Pautas que não vierem do radar usam radar_id "".
CASOS PÚBLICOS: a notícia é o gancho, com fonte; o foco é o instituto jurídico e a estratégia possível em tese para o credor. Nunca opinar sobre o mérito, sobre o devedor ou sobre a atuação dos advogados das partes.

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
      required: ["tema", "modelo", "pilar", "angulo", "justificativa", "dia_sugerido", "radar_id"],
      properties: {
        tema: { type: "string" },
        modelo: { type: "string", enum: ["lista", "pergunta", "mitofato"] },
        pilar: { type: "string", enum: ["Gestão de Inadimplência", "Diálogo com o Gestor Escolar", "Gestão de Contratos",
          "Relações Consumeristas", "Casos Ilustrativos", "Casos em Pauta", "Relações Societárias e Sucessão"] },
        angulo: { type: "string" }, justificativa: { type: "string" }, dia_sugerido: { type: "string" }, radar_id: { type: "string" },
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

  async function chamar(agente: keyof typeof MODELOS, sistema: string, msg: string, schema?: unknown, ferramentas?: unknown[]) {
    const M = MODELOS[agente];
    if (Number(gasto ?? 0) >= teto) {
      await admin.from("agente_execucoes").insert({ agente, status: "bloqueado_teto", erro: `Teto de US$ ${teto} atingido.` });
      return { r: null, falha: `Teto mensal de US$ ${teto} atingido.` };
    }
    const inicio = Date.now();
    try {
      const mensagens: any[] = [{ role: "user", content: msg }];
      let d: any, resp: Response, conteudo: any[] = [];
      const uso = { input_tokens: 0, output_tokens: 0, buscas: 0 };
      for (let volta = 0; volta < 4; volta++) {
        resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": CHAVE!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({ model: M.id, max_tokens: agente === "pericles" ? 1500 : 8000, system: sistema,
            ...(schema ? { output_config: { format: { type: "json_schema", schema } } } : {}),
            ...(ferramentas ? { tools: ferramentas } : {}),
            messages: mensagens }),
        });
        d = await resp.json();
        uso.input_tokens += d.usage?.input_tokens || 0; uso.output_tokens += d.usage?.output_tokens || 0;
        uso.buscas += d.usage?.server_tool_use?.web_search_requests || 0;
        conteudo = conteudo.concat(d.content || []);
        if (d.stop_reason !== "pause_turn") break;
        mensagens.push({ role: "assistant", content: d.content });
      }
      const custo = (uso.input_tokens * M.entrada + uso.output_tokens * M.saida) / 1e6 + uso.buscas * PRECO_BUSCA;
      const texto = conteudo.filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
      if (ferramentas) (chamar as any).ultimoConteudo = conteudo;
      let r: any = null, falha = "";
      if (!resp!.ok) falha = "API: " + (d?.error?.message || resp!.status);
      else if (d.stop_reason === "refusal" || d.stop_reason === "max_tokens") falha = "Resposta incompleta (" + d.stop_reason + ").";
      else if (schema) { try { r = JSON.parse(texto); } catch { falha = "Resposta fora do formato."; } }
      else r = texto.trim();
      await admin.from("agente_execucoes").insert({ agente, modelo: M.id, status: r ? "ok" : "erro",
        tokens_entrada: uso.input_tokens, tokens_saida: uso.output_tokens, custo_usd: custo,
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
    const { data: radar } = await admin.from("radar_itens").select("id,categoria,titulo,resumo,fonte,data_publicacao,gancho_juridico,estrategia_em_tese,relevancia,url")
      .eq("semana", semana).eq("status", "novo").order("relevancia", { ascending: false }).limit(15);
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
${(regras || []).length ? `\nREGRAS DO ADVOGADO:\n${regras!.map((r) => `- ${r.regra}`).join("\n")}` : ""}

RADAR DA SEMANA (Rondon):
${(radar || []).map((x) => `- id ${x.id} [${x.categoria} · relevância ${x.relevancia}] ${x.titulo} (${x.fonte}, ${x.data_publicacao}). ${x.resumo} | Gancho: ${x.gancho_juridico || "-"}`).join("\n") || "- sem itens nesta semana"}`;
    const { r, falha } = await chamar("atena", SISTEMA_ATENA, msg, SCHEMA_ATENA);
    if (!r) return json({ erro: "Atena: " + falha }, 502);
    const radarPorId = Object.fromEntries((radar || []).map((x) => [x.id, x]));
    const linhas = (r.pautas || []).slice(0, n).map((p: any, i: number) => {
      const item = radarPorId[p.radar_id];
      return { ...p, radar_id: item ? item.id : null, fonte_url: item ? item.url : null, semana, ordem: i + 1 };
    });
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


  /* =============== RADAR (RONDON) =============== */
  const TAREFAS_RADAR: Record<string, { categoria: string; pedido: string }> = {
    radar_casos: { categoria: "caso_publico", pedido:
      "Notícias sobre decisões judiciais e casos envolvendo famosos, celebridades, influenciadores, atletas, empresários ou pessoas públicas no Brasil ligados a dívidas, cobrança, execução, penhora (de bens, contas, salários, cachês, faturamento, valores a receber), bloqueios (SISBAJUD, RENAJUD), protesto, recuperação judicial ou fraude contra credores." },
    radar_numeros: { categoria: "numeros", pedido:
      "Índices, pesquisas, estatísticas e relatórios oficiais divulgados sobre inadimplência e endividamento no Brasil (por exemplo: Serasa, CNC/Peic, Banco Central, CNDL/SPC, IBGE, Equifax/Boa Vista, FGV). Traga os números exatamente como na fonte." },
    radar_setores: { categoria: "setores", pedido:
      "Notícias sobre inadimplência e cobrança em setores específicos: educação (escolas particulares, faculdades, mensalidades, Semesp, FIES) e serviços pós-pagos (telefonia, internet, energia, água, planos de saúde, condomínios, academias). Inclua também decisões relevantes de tribunais superiores sobre cobrança e execução de dívidas." },
  };
  if (TAREFAS_RADAR[corpo.tarefa || ""] || corpo.tarefa === "radar_perfis") {
    const inicio7 = new Date(hoje); inicio7.setDate(inicio7.getDate() - 7);
    const janela = `entre ${inicio7.toLocaleDateString("pt-BR")} e ${hoje.toLocaleDateString("pt-BR")}`;
    const local = { type: "approximate", country: "BR", region: "Paraná", city: "Curitiba", timezone: "America/Sao_Paulo" };

    if (corpo.tarefa === "radar_perfis") {
      const { data: jaTem } = await admin.from("perfis_referencia").select("nome,endereco");
      const sistemaP = "Você é Rondon, pesquisador do Estúdio de Marketing de um escritório de advocacia de recuperação de crédito. Pesquise na web e responda em português, citando as fontes.";
      const pedidoP = `Encontre perfis, sites, canais e profissionais brasileiros que produzem conteúdo frequente sobre cobrança, recuperação de crédito, inadimplência (especialmente escolar) e execução de dívidas, voltado a empresas e credores. Para cada um: nome, tipo (instagram, site, youtube, linkedin ou outro), endereço (@ ou URL) e por que é relevante. Não repita estes, já cadastrados: ${(jaTem || []).map((x) => x.nome + " " + (x.endereco || "")).join("; ") || "nenhum"}.`;
      const busca = await chamar("rondon", sistemaP, pedidoP, undefined, [{ type: "web_search_20250305", name: "web_search", max_uses: 5, user_location: local }]);
      if (!busca.r) return json({ erro: "Rondon: " + busca.falha }, 502);
      const SCHEMA_P = { type: "object", additionalProperties: false, required: ["perfis"], properties: { perfis: { type: "array", items: {
        type: "object", additionalProperties: false, required: ["nome", "tipo", "endereco", "observacao"], properties: {
          nome: { type: "string" }, tipo: { type: "string", enum: ["instagram", "site", "youtube", "linkedin", "outro"] },
          endereco: { type: "string" }, observacao: { type: "string" } } } } } };
      const ext = await chamar("rondon_extrator", "Extraia os dados pedidos do texto, sem inventar nada que não esteja nele.", busca.r, SCHEMA_P);
      if (!ext.r) return json({ erro: "Rondon (extração): " + ext.falha }, 502);
      const existentes = new Set((jaTem || []).map((x) => (x.endereco || x.nome).toLowerCase()));
      const novos = (ext.r.perfis || []).filter((x: any) => !existentes.has((x.endereco || x.nome).toLowerCase()))
        .slice(0, 10).map((x: any) => ({ ...x, origem: "rondon", status: "sugerido" }));
      if (novos.length) await admin.from("perfis_referencia").insert(novos);
      return json({ ok: true, sugeridos: novos.length, origem });
    }

    const T = TAREFAS_RADAR[corpo.tarefa!];
    const { data: fontes } = await admin.from("fontes_confiaveis").select("dominio").eq("ativo", true);
    const dominios = (fontes || []).map((f) => f.dominio);
    const sistemaR = `Você é Rondon, pesquisador do Estúdio de Marketing da Palácio Gomes Advocacia (recuperação de crédito para empresas e escolas). Pesquise na web SOMENTE notícias publicadas ${janela}. Descarte qualquer conteúdo mais antigo ou sem data verificável. Não especule nem complete lacunas: relate apenas o que as fontes dizem, citando-as. Responda em português.`;
    const busca = await chamar("rondon", sistemaR, `${T.pedido}\n\nPara cada notícia encontrada (até 6, as mais relevantes): o que aconteceu, quem divulgou, a data de publicação e qual instrumento ou tema jurídico aparece.`,
      undefined, [{ type: "web_search_20250305", name: "web_search", max_uses: 6, user_location: local, ...(dominios.length ? { allowed_domains: dominios } : {}) }]);
    if (!busca.r) return json({ erro: "Rondon: " + busca.falha }, 502);

    // URLs que de fato apareceram na pesquisa (impede link inventado)
    const blocos: any[] = (chamar as any).ultimoConteudo || [];
    const urls = new Set<string>();
    blocos.forEach((b) => {
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) b.content.forEach((x: any) => x.url && urls.add(x.url));
      if (b.type === "text" && Array.isArray(b.citations)) b.citations.forEach((c: any) => c.url && urls.add(c.url));
    });
    const SCHEMA_R = { type: "object", additionalProperties: false, required: ["itens"], properties: { itens: { type: "array", items: {
      type: "object", additionalProperties: false,
      required: ["titulo", "resumo", "fonte", "url", "data_publicacao", "gancho_juridico", "estrategia_em_tese", "risco_etico", "relevancia"],
      properties: {
        titulo: { type: "string" }, resumo: { type: "string" }, fonte: { type: "string" }, url: { type: "string" },
        data_publicacao: { type: "string", description: "dd/mm/aaaa" },
        gancho_juridico: { type: "string", description: "Instituto jurídico envolvido, ex.: penhora de valores a receber (CPC, art. 855)" },
        estrategia_em_tese: { type: "string", description: "Medida que um credor poderia adotar em situação semelhante, em tese, sem opinar sobre o caso" },
        risco_etico: { type: "string", description: "Cuidado necessário ao usar em publicação de advogado (Prov. 205/2021), ou vazio" },
        relevancia: { type: "integer", description: "1 a 5, para credores, escolas e empresas" } } } } } };
    const ext = await chamar("rondon_extrator",
      `Transforme a pesquisa em itens estruturados. Use SOMENTE estas URLs: ${[...urls].join(" , ")}. Não inclua item sem URL dessa lista ou com data fora do período ${janela}. Não invente dados.`,
      busca.r, SCHEMA_R);
    if (!ext.r) return json({ erro: "Rondon (extração): " + ext.falha }, 502);
    const itens = (ext.r.itens || []).filter((x: any) => urls.has(x.url)).slice(0, 6)
      .map((x: any) => ({ ...x, relevancia: Math.min(5, Math.max(1, Number(x.relevancia) || 3)), semana, categoria: T.categoria }));
    await admin.from("radar_itens").delete().eq("semana", semana).eq("categoria", T.categoria).eq("status", "novo");
    if (itens.length) await admin.from("radar_itens").insert(itens);
    return json({ ok: true, categoria: T.categoria, itens: itens.length, descartados_sem_fonte: (ext.r.itens || []).length - itens.length, origem });
  }

  return json({ erro: "Tarefa desconhecida." }, 400);
});
