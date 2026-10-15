// Estúdio de Marketing · Edge Function "site"
// Machado (artigos para palaciogomes.com.br/publicacoes), revisão da Têmis, publicação no GitHub,
// auditoria mensal do site e sugestão mensal de post para o Google Business Profile.
// Chamada pelo agendador (cabeçalho x-cron-secret) ou pela tela (usuário logado).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const REPO = "joaopdsg1/site-palacio";
const RAMO = "main";
const DOMINIO = "https://palaciogomes.com.br";
const REVISOR = "João Pedro Palácio Gomes, OAB/PR nº 131.562";

// Preços em US$ por milhão de tokens (out/2026)
const MODELOS: Record<string, { id: string; entrada: number; saida: number }> = {
  machado: { id: "claude-sonnet-5-5", entrada: 2, saida: 10 },
  machado_pesquisa: { id: "claude-sonnet-5-5", entrada: 2, saida: 10 },
  machado_gbp: { id: "claude-haiku-5-5", entrada: 0.10, saida: 0.50 },
  temis: { id: "claude-opus-5-5", entrada: 4, saida: 20 },
};
const PRECO_BUSCA = 0.01;

/* ======================= INSTRUÇÕES ======================= */
const SISTEMA_MACHADO = `Você é Machado, redator de artigos do site palaciogomes.com.br, da Palácio Gomes Advogados — escritório especializado em recuperação de crédito e gestão de inadimplência para escolas, clínicas e empresas, com atuação em todo o Brasil. Você transforma peças aprovadas do Instagram e pautas do advogado em artigos para a página Publicações.

PÚBLICO: diretor(a) ou mantenedor(a) de escola particular; gestor(a) de clínica ou de empresa credora. Nunca o devedor.

OBJETIVO: o artigo deve ser a melhor resposta em português para a dúvida do gestor, a ponto de ser encontrado no Google e citado por assistentes de IA. Por isso:
- "titulo": usa as palavras que o gestor digitaria na busca, de forma natural, com até 60 caracteres. Nada de caça-cliques.
- "introducao": 2 parágrafos curtos que respondem à pergunta principal logo nas primeiras frases; o restante aprofunda.
- "secoes": 4 a 6. Títulos claros, de preferência a pergunta que o gestor faria. Parágrafos de 2 a 4 frases. Use "itens" (lista) só quando houver passos ou critérios enumeráveis; caso contrário, deixe a lista vazia.
- Toda afirmação jurídica indica o dispositivo (lei e artigo) e está correta e atualizada. Na dúvida, não afirme: registre em "pontos_de_verificacao" para o advogado conferir.
- "faq": 3 a 5 perguntas; cada resposta é autônoma (2 a 4 frases) e compreensível sem ler o resto.
- Extensão total (introdução + seções + perguntas): entre 900 e 1.400 palavras.
- Negrito com **asteriscos** apenas em poucas expressões-chave.
- "descricao": resumo para o Google entre 120 e 155 caracteres. "resumo": 1 ou 2 frases para a lista de publicações.
- "slug": endereço curto, em minúsculas, sem acentos, palavras separadas por hífen (ex.: inadimplencia-escolar-rematricula).
- "fontes": somente links que vieram no material recebido (peça, notícia ou pesquisa). Nunca invente endereço. Pode ficar vazio.

TOM: claro, sereno e técnico, como um advogado explicando a um gestor inteligente. Sem jargão desnecessário, sem alarmismo. Português do Brasil.

REGRAS ÉTICAS (Provimento 205/2021 e Código de Ética da OAB), invioláveis:
- Conteúdo meramente informativo. Nunca prometa resultado; nunca cite clientes, casos patrocinados, valores recuperados, depoimentos, preços ou gratuidade.
- Nunca convide a contratar, a "falar com a gente", a mandar dúvidas ou a agendar consulta. O site acrescenta automaticamente uma ressalva e um link para a página de atuação do escritório; não escreva chamada final.
- Não compare com outros escritórios nem faça autopromoção.
- Não exponha nem ridicularize devedores.
- Caso público noticiado: use só fatos publicados, com a fonte; nunca opine sobre o mérito, sobre a culpa das partes ou sobre a atuação dos advogados envolvidos; o caso é apenas o gancho para explicar o instituto jurídico e o que um credor pode fazer, em tese.
- Não use referências de tempo relativas ("esta semana", "ontem", "recentemente"); use datas quando necessário. O artigo deve continuar útil daqui a um ano.

Responda somente com o JSON no formato solicitado.`;

const SCHEMA_MACHADO = {
  type: "object",
  required: ["titulo", "slug", "descricao", "resumo", "introducao", "secoes", "faq", "fontes", "pontos_de_verificacao"],
  properties: {
    titulo: { type: "string" }, slug: { type: "string" }, descricao: { type: "string" }, resumo: { type: "string" },
    introducao: { type: "array", items: { type: "string" } },
    secoes: { type: "array", items: { type: "object", required: ["titulo", "paragrafos", "itens"],
      properties: { titulo: { type: "string" }, paragrafos: { type: "array", items: { type: "string" } }, itens: { type: "array", items: { type: "string" } } } } },
    faq: { type: "array", items: { type: "object", required: ["pergunta", "resposta"],
      properties: { pergunta: { type: "string" }, resposta: { type: "string" } } } },
    fontes: { type: "array", items: { type: "object", required: ["titulo", "url"],
      properties: { titulo: { type: "string" }, url: { type: "string" } } } },
    pontos_de_verificacao: { type: "array", items: { type: "string" } },
  },
};

const SISTEMA_TEMIS = `Você é Têmis, revisora de conformidade ética e jurídica do Estúdio de Marketing da Palácio Gomes Advogados. Você revisa ARTIGOS do site palaciogomes.com.br ANTES de chegarem ao advogado responsável, que é quem decide e publica. Seu "aprovado" significa apenas "sem objeções da revisão".

Seja rigorosa e objetiva. Na dúvida, aponte. Cite sempre o trecho exato.

CHECKLIST (avalie TODOS os itens no título, descrição, resumo, introdução, seções e perguntas frequentes):
 1. Promessa ou sugestão de resultado ("recuperamos X%", "garantimos", prazos de êxito).
 2. Menção a clientes do escritório, casos patrocinados por ele, valores obtidos ou números de processo.
 3. Captação ou mercantilização: "contrate", preço, gratuidade, desconto, urgência artificial (Prov. 205/2021, art. 3º, I).
 4. Comparação com outros escritórios ou autopromoção (art. 3º, IV).
 5. Sensacionalismo ou exploração de temas para atrair clientela, inclusive no título.
 6. Afirmação jurídica sem fundamento indicado, ou com fundamento incorreto ou desatualizado.
 7. Chamada final ao contato ou à contratação, convite a consultas individuais ou a enviar dúvidas (o site já acrescenta automaticamente uma ressalva informativa e um link institucional; o texto não deve ter chamada).
 8. Caso concreto, decisão judicial ou resultado apresentado como feito do escritório (arts. 4º §2º, 5º §3º, 6º).
 9. Expressões persuasivas, de autoengrandecimento ou incitação direta ao litígio (art. 3º, IV e §1º).
10. Referências de tempo relativas ("esta semana", "recentemente") que envelhecem o texto.
11. Conteúdo que exponha, ridicularize ou estereotipe devedores (CDC, art. 42).
12. Uso de caso público noticiado: falta de fonte; opinião sobre o mérito, a culpa das partes ou a atuação dos advogados (Código de Ética, art. 42, II); adjetivos ou exposição da pessoa além do noticiado; estratégia apresentada como promessa ou como serviço do escritório. Estratégia apresentada em tese, com dispositivo, é permitida.

GRAVIDADE de cada apontamento:
- "alta": viola regra ética ou contém erro jurídico → parecer não pode ser "aprovado".
- "media": risco relevante ou redação que pode ser lida como violação → "ajustar".
- "baixa": melhoria recomendada; não impede "aprovado".

PARECER:
- "bloquear": tema ou abordagem incompatível com as regras, e ajuste de redação não resolve.
- "ajustar": há apontamento de gravidade alta ou média corrigível.
- "aprovado": apenas apontamentos de gravidade baixa, ou nenhum.

CONFERÊNCIA JURÍDICA: para cada afirmação jurídica do artigo, informe o dispositivo citado, se ele sustenta a afirmação e sua confiança (alta/media/baixa). Confiança "media" ou "baixa" deve ser explicada — o advogado vai conferir.

No campo "onde", use "título", "descrição", "resumo", "introdução", "seção N", "pergunta N" ou "fontes".

Responda somente com o JSON no formato solicitado.`;

const SCHEMA_TEMIS = {
  type: "object",
  required: ["parecer", "resumo", "apontamentos", "conferencia_juridica"],
  properties: {
    parecer: { type: "string", enum: ["aprovado", "ajustar", "bloquear"] },
    resumo: { type: "string" },
    apontamentos: { type: "array", items: { type: "object",
      required: ["criterio", "onde", "trecho", "problema", "sugestao", "gravidade"],
      properties: { criterio: { type: "integer" }, onde: { type: "string" }, trecho: { type: "string" },
        problema: { type: "string" }, sugestao: { type: "string" }, gravidade: { type: "string", enum: ["alta", "media", "baixa"] } } } },
    conferencia_juridica: { type: "array", items: { type: "object",
      required: ["afirmacao", "dispositivo", "sustenta", "confianca", "observacao"],
      properties: { afirmacao: { type: "string" }, dispositivo: { type: "string" }, sustenta: { type: "boolean" },
        confianca: { type: "string", enum: ["alta", "media", "baixa"] }, observacao: { type: "string" } } } },
  },
};

const SISTEMA_PESQUISA = `Você é o assistente de pesquisa do Machado, redator de artigos jurídicos informativos de um escritório especializado em recuperação de crédito. Pesquise o tema ou a notícia indicada e entregue, em até 350 palavras, um levantamento factual para servir de base ao artigo:
- os fatos principais, cada um com a data e o link da fonte;
- os dispositivos legais aplicáveis ao tema (lei e artigo);
- o que ainda está em aberto ou em disputa, sem tomar partido.
Seja estritamente factual: sem opinião, sem adjetivos sobre as pessoas envolvidas. Prefira fontes jornalísticas reconhecidas e sites oficiais. Português do Brasil.`;

const SISTEMA_GBP = `Você escreve o post mensal do Perfil da Empresa no Google (Google Business Profile) da Palácio Gomes Advogados, escritório especializado em recuperação de crédito e gestão de inadimplência para escolas, clínicas e empresas.
Regras: texto corrido de 500 a 900 caracteres, informativo, que apresente a ideia central do material recebido e termine convidando a ler o artigo completo no site (sem link no texto; o link é colocado no botão do post). Sem emojis, sem hashtags, sem promessas de resultado, sem preços, sem "contrate", sem convite a consulta, sem citar clientes (Provimento 205/2021). Português do Brasil. Responda somente com o texto do post.`;

/* ======================= UTILIDADES ======================= */
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
const contaPalavras = (s: unknown) => String(s ?? "").replace(/\*+/g, "").trim().split(/\s+/).filter(Boolean).length;
function palavrasArtigo(r: any): number {
  let n = 0;
  (r.introducao || []).forEach((p: string) => n += contaPalavras(p));
  (r.secoes || []).forEach((s: any) => { n += contaPalavras(s.titulo); (s.paragrafos || []).forEach((p: string) => n += contaPalavras(p)); (s.itens || []).forEach((p: string) => n += contaPalavras(p)); });
  (r.faq || []).forEach((f: any) => n += contaPalavras(f.pergunta) + contaPalavras(f.resposta));
  return n;
}
function slugificar(s: string): string {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/g, "");
}
function problemasFormato(r: any): string[] {
  const v: string[] = [];
  const p = palavrasArtigo(r);
  if (p < 850) v.push(`texto com ${p} palavras (mínimo 900)`);
  if (p > 1600) v.push(`texto com ${p} palavras (máximo 1.400)`);
  const t = String(r.titulo || "").replace(/\*+/g, "");
  if (t.length > 65) v.push(`título com ${t.length} caracteres (máximo 60)`);
  const d = String(r.descricao || "");
  if (d.length > 160 || d.length < 110) v.push(`descrição com ${d.length} caracteres (entre 120 e 155)`);
  const ns = (r.secoes || []).length;
  if (ns < 3 || ns > 7) v.push(`${ns} seções (entre 4 e 6)`);
  const nf = (r.faq || []).length;
  if (nf < 3 || nf > 5) v.push(`${nf} perguntas frequentes (entre 3 e 5)`);
  return v;
}
const urlsDe = (s: unknown) => [...String(s ?? "").matchAll(/https?:\/\/[^\s<>"')\]]+/g)].map((m) => m[0].replace(/[.,;:]+$/, ""));

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmt = (s: unknown) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*+/g, "");
const semMarcas = (s: unknown) => String(s ?? "").replace(/\*+/g, "");
const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
const dataBR = (d: string | Date) => new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
const dataISO = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

/* ======================= GITHUB ======================= */
function github(token: string) {
  const base = `https://api.github.com/repos/${REPO}`;
  const h = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "estudio-palacio" };
  async function req(path: string, init: RequestInit = {}) {
    const r = await fetch(base + path, { ...init, headers: { ...h, ...(init.headers || {}) } });
    const corpo = await r.text();
    let j: any = null; try { j = JSON.parse(corpo); } catch { /* vazio */ }
    if (!r.ok) throw new Error(`GitHub ${r.status}: ${j?.message || corpo.slice(0, 200)}`);
    return j;
  }
  return {
    async ler(caminho: string): Promise<string | null> {
      try {
        const j = await req(`/contents/${caminho}?ref=${RAMO}`);
        const bin = atob(String(j.content || "").replace(/\n/g, ""));
        return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      } catch (e) { if (String(e).includes("404")) return null; throw e; }
    },
    async commitar(arquivos: { path: string; content: string | null }[], mensagem: string): Promise<string> {
      const ref = await req(`/git/ref/heads/${RAMO}`);
      const pai = ref.object.sha;
      const commitPai = await req(`/git/commits/${pai}`);
      const arvore = await req(`/git/trees`, { method: "POST", body: JSON.stringify({
        base_tree: commitPai.tree.sha,
        tree: arquivos.map((a) => a.content === null
          ? { path: a.path, mode: "100644", type: "blob", sha: null }
          : { path: a.path, mode: "100644", type: "blob", content: a.content }),
      }) });
      const novo = await req(`/git/commits`, { method: "POST", body: JSON.stringify({ message: mensagem, tree: arvore.sha, parents: [pai] }) });
      await req(`/git/refs/heads/${RAMO}`, { method: "PATCH", body: JSON.stringify({ sha: novo.sha }) });
      return novo.sha;
    },
  };
}

/* ======================= PÁGINAS DO SITE ======================= */
type Moldura = { cabecalho: string; rodape: string; cauda: string };
async function moldura(gh: ReturnType<typeof github>): Promise<Moldura> {
  const base = await gh.ler("privacidade.html");
  if (!base) throw new Error("Não encontrei privacidade.html no repositório para copiar o cabeçalho e o rodapé.");
  const cab = base.match(/<header class="topo[^"]*">[\s\S]*?<\/header>/);
  const rod = base.match(/<footer class="rodape">[\s\S]*?<\/footer>/);
  const cauda = base.match(/<\/footer>([\s\S]*?)<\/body>/);
  if (!cab || !rod) throw new Error("Cabeçalho ou rodapé do site não reconhecidos.");
  const cabecalho = cab[0].replace(/ aria-current="page"/g, "").replace('href="/publicacoes"', 'href="/publicacoes" aria-current="page"');
  return { cabecalho, rodape: rod[0], cauda: (cauda ? cauda[1] : "").trim() };
}

function cabecaHtml(o: { titulo: string; descricao: string; url: string; tipo: string; extra?: string }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.titulo)}</title>
<meta name="description" content="${esc(o.descricao)}">
<link rel="canonical" href="${o.url}">
<meta name="theme-color" content="#292465">
<meta property="og:type" content="${o.tipo}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(o.titulo)}">
<meta property="og:description" content="${esc(o.descricao)}">
<meta property="og:url" content="${o.url}">
<meta property="og:image" content="${DOMINIO}/assets/midia/xadrez-poster.jpg">
<link rel="icon" href="/assets/marca/coluna-indigo.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css">${o.extra || ""}
</head>`;
}

function paginaArtigo(a: any, m: Moldura): string {
  const c = a.conteudo || {};
  const url = `${DOMINIO}/publicacoes/${a.slug}`;
  const publicado = a.publicado_em || new Date().toISOString();
  const grafo = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: semMarcas(a.titulo), description: a.descricao, url, mainEntityOfPage: url,
      datePublished: publicado, dateModified: new Date().toISOString(), inLanguage: "pt-BR",
      image: `${DOMINIO}/assets/midia/xadrez-poster.jpg`,
      author: { "@type": "Person", name: "João Pedro Palácio Gomes", url: `${DOMINIO}/#equipe` },
      publisher: { "@type": "LegalService", "@id": `${DOMINIO}/#escritorio`, name: "Palácio Gomes Advogados", url: `${DOMINIO}/` } },
    { "@type": "FAQPage", mainEntity: (c.faq || []).map((f: any) => ({ "@type": "Question", name: semMarcas(f.pergunta),
      acceptedAnswer: { "@type": "Answer", text: semMarcas(f.resposta) } })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: `${DOMINIO}/` },
      { "@type": "ListItem", position: 2, name: "Publicações", item: `${DOMINIO}/publicacoes` },
      { "@type": "ListItem", position: 3, name: semMarcas(a.titulo), item: url }] },
  ] };
  const corpo = [
    ...(c.introducao || []).map((p: string) => `<p>${fmt(p)}</p>`),
    ...(c.secoes || []).map((s: any) => [
      `<h2>${fmt(s.titulo)}</h2>`,
      ...(s.paragrafos || []).map((p: string) => `<p>${fmt(p)}</p>`),
      (s.itens || []).length ? `<ul>${s.itens.map((i: string) => `<li>${fmt(i)}</li>`).join("")}</ul>` : "",
    ].join("\n")),
  ].join("\n");
  const faq = (c.faq || []).length ? `<h2>Perguntas frequentes</h2>
<div class="perguntas">
${c.faq.map((f: any) => `<details><summary>${fmt(f.pergunta)}</summary><div class="resp"><p>${fmt(f.resposta)}</p></div></details>`).join("\n")}
</div>` : "";
  const fontes = (c.fontes || []).length ? `<h2>Fontes</h2>
<ul class="fontes">${c.fontes.map((f: any) => `<li><a href="${esc(f.url)}" rel="noopener nofollow">${esc(f.titulo || f.url)}</a></li>`).join("")}</ul>` : "";
  return `${cabecaHtml({ titulo: `${semMarcas(a.titulo)} | Palácio Gomes Advogados`, descricao: a.descricao, url, tipo: "article",
    extra: `\n<meta property="article:published_time" content="${publicado}">\n<script type="application/ld+json">\n${ld(grafo)}\n</script>` })}
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${m.cabecalho}
<main id="conteudo">
<section class="cabeca-pag">
  <div class="envolve">
    <p class="rotulo"><a href="/publicacoes">Publicações</a> · ${dataBR(publicado)}</p>
    <h1>${fmt(a.titulo)}</h1>
    <p>${fmt(a.resumo)}</p>
  </div>
</section>
<article class="secao">
  <div class="envolve">
    <div class="texto corpo artigo">
${corpo}
${faq}
${fontes}
      <p class="ressalva">Conteúdo informativo, de caráter geral, que não substitui a análise de um advogado sobre o caso concreto. Publicado em ${dataBR(publicado)}. Revisão: ${REVISOR}.</p>
      <p class="leia-mais"><a class="btn cheio" href="/recuperacao-de-credito">Como o escritório conduz a recuperação de crédito</a></p>
    </div>
  </div>
</article>
</main>
${m.rodape}
${m.cauda}
</body>
</html>
`;
}

function paginaLista(artigos: any[], m: Moldura): string {
  const url = `${DOMINIO}/publicacoes`;
  const grafo = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Publicações", url,
    isPartOf: { "@id": `${DOMINIO}/#escritorio` },
    hasPart: artigos.map((a) => ({ "@type": "Article", headline: semMarcas(a.titulo), url: `${DOMINIO}/publicacoes/${a.slug}`, datePublished: a.publicado_em })) };
  const lista = artigos.length
    ? `<ul class="lista-artigos">
${artigos.map((a) => `<li><p class="data">${dataBR(a.publicado_em)}</p><h2><a href="/publicacoes/${a.slug}">${fmt(a.titulo)}</a></h2><p>${fmt(a.resumo)}</p></li>`).join("\n")}
</ul>`
    : `<div class="vazio">
      <h3>Os primeiros artigos estão em preparação</h3>
      <p>Enquanto isso, acompanhe os conteúdos do escritório no Instagram.</p>
      <p style="margin-top:20px"><a class="btn cheio" href="https://www.instagram.com/palaciogomes.adv/" rel="noopener">Ver @palaciogomes.adv</a></p>
    </div>`;
  return `${cabecaHtml({ titulo: "Publicações | Palácio Gomes Advogados",
    descricao: "Artigos informativos do Palácio Gomes Advogados sobre recuperação de crédito, inadimplência escolar e contratos.",
    url, tipo: "website", extra: `\n<script type="application/ld+json">\n${ld(grafo)}\n</script>` })}
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${m.cabecalho}
<main id="conteudo">
<section class="cabeca-pag">
  <div class="envolve">
    <p class="rotulo">Publicações</p>
    <h1>Artigos sobre cobrança e inadimplência</h1>
    <p>Textos informativos sobre recuperação de crédito, inadimplência escolar e gestão de contratos.</p>
  </div>
</section>
<section class="secao">
  <div class="envolve">
    ${lista}
  </div>
</section>
</main>
${m.rodape}
${m.cauda}
</body>
</html>
`;
}

function sitemap(artigos: any[]): string {
  const ultimo = artigos.length ? dataISO(artigos[0].publicado_em) : "2026-10-15";
  const fixas: [string, string][] = [["/", "2026-10-15"], ["/recuperacao-de-credito", "2026-10-15"], ["/publicacoes", ultimo], ["/privacidade", "2026-10-15"]];
  const linhas = [
    ...fixas.map(([p, d]) => `  <url><loc>${DOMINIO}${p}</loc><lastmod>${d}</lastmod></url>`),
    ...artigos.map((a) => `  <url><loc>${DOMINIO}/publicacoes/${a.slug}</loc><lastmod>${dataISO(a.atualizado_em || a.publicado_em)}</lastmod></url>`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${linhas.join("\n")}\n</urlset>\n`;
}

function llmsAtualizado(atual: string, artigos: any[]): string {
  const sem = atual.replace(/\n## Artigos\n[\s\S]*?(?=\n## |\s*$)/, "").replace(/\s+$/, "");
  if (!artigos.length) return sem + "\n";
  const bloco = `## Artigos\n${artigos.map((a) => `- [${semMarcas(a.titulo)}](${DOMINIO}/publicacoes/${a.slug}): ${a.descricao}`).join("\n")}`;
  return sem.includes("\n## Equipe")
    ? sem.replace("\n## Equipe", `\n${bloco}\n\n## Equipe`) + "\n"
    : sem + "\n\n" + bloco + "\n";
}

/* ======================= HANDLER ======================= */
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

  let corpo: { tarefa?: string; artigo_id?: string; pedido?: string; forcar?: boolean };
  try { corpo = await req.json(); } catch { return json({ erro: "Requisição inválida." }, 400); }
  const tarefa = corpo.tarefa || "";

  const { data: cfgs } = await admin.from("config").select("chave,valor");
  const cfg = Object.fromEntries((cfgs || []).map((c) => [c.chave, Number(c.valor)]));
  const teto = cfg.teto_mensal_usd || 12;
  const { data: gasto } = await admin.rpc("custo_mes");
  const CHAVE = Deno.env.get("ANTHROPIC_API_KEY");

  async function chamar(agente: string, sistema: string, msg: string, schema?: unknown, ferramentas?: unknown[], maxTokens = 8000) {
    const M = MODELOS[agente];
    if (!CHAVE) return { r: null, falha: "Chave da API não cadastrada.", urls: [] as string[] };
    if (Number(gasto ?? 0) >= teto) {
      await admin.from("agente_execucoes").insert({ agente: agente.split("_")[0], status: "bloqueado_teto", erro: `Teto de US$ ${teto} atingido.` });
      return { r: null, falha: `Teto mensal de US$ ${teto} atingido.`, urls: [] as string[] };
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
          body: JSON.stringify({ model: M.id, max_tokens: maxTokens, system: sistema,
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
      const texto = conteudo.filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
      const urls: string[] = [];
      conteudo.forEach((b: any) => { if (b.type === "web_search_tool_result" && Array.isArray(b.content)) b.content.forEach((x: any) => x.url && urls.push(x.url)); });
      let r: any = null, falha = "";
      if (!resp!.ok) falha = "API: " + (d?.error?.message || resp!.status);
      else if (d.stop_reason === "refusal" || d.stop_reason === "max_tokens") falha = "Resposta incompleta (" + d.stop_reason + ").";
      else if (schema) { try { r = JSON.parse(texto); } catch { falha = "Resposta fora do formato."; } }
      else r = texto.trim();
      await admin.from("agente_execucoes").insert({ agente: agente.split("_")[0], modelo: M.id, status: r ? "ok" : "erro",
        tokens_entrada: uso.input_tokens, tokens_saida: uso.output_tokens, custo_usd: custo,
        duracao_ms: Date.now() - inicio, erro: r ? null : falha });
      return { r, falha, urls };
    } catch (e) {
      await admin.from("agente_execucoes").insert({ agente: agente.split("_")[0], modelo: M.id, status: "erro", erro: "Rede: " + String(e), duracao_ms: Date.now() - inicio });
      return { r: null, falha: "Falha de rede.", urls: [] as string[] };
    }
  }

  async function carregar(id?: string) {
    if (!id) return null;
    const { data } = await admin.from("artigos").select("*").eq("id", id).maybeSingle();
    return data;
  }
  async function regrasMachado() {
    const { data } = await admin.from("aprendizados").select("regra").eq("ativo", true).in("agente", ["machado", "todas"]).order("criado_em");
    return (data || []).length ? `\n\nREGRAS DEFINIDAS PELO ADVOGADO (têm prioridade):\n${data!.map((r, i) => `${i + 1}. ${r.regra}`).join("\n")}` : "";
  }

  /* ---------- PESQUISA (tema enviado pelo advogado) ---------- */
  async function pesquisar(a: any) {
    const msg = `TEMA OU NOTÍCIA: ${a.tema || "-"}\n${a.observacoes ? `MATERIAL ENVIADO PELO ADVOGADO:\n${a.observacoes}\n` : ""}\nFaça o levantamento.`;
    const { r, falha, urls } = await chamar("machado_pesquisa", SISTEMA_PESQUISA, msg, undefined,
      [{ type: "web_search_20250305", name: "web_search", max_uses: 4, user_location: { type: "approximate", country: "BR", timezone: "America/Sao_Paulo" } }], 3000);
    if (!r) return { ok: false, falha };
    const texto = `${r}\n\nLINKS CONSULTADOS:\n${[...new Set(urls)].slice(0, 12).join("\n")}`;
    await admin.from("artigos").update({ pesquisa: texto, atualizado_em: new Date().toISOString() }).eq("id", a.id);
    return { ok: true };
  }

  /* ---------- MACHADO ESCREVE ---------- */
  async function escrever(a: any, pedido?: string) {
    let base = "";
    let permitidas: string[] = [];
    if (a.origem === "peca" && a.peca_id) {
      const { data: p } = await admin.from("pecas").select("titulo,tema,pilar,modelo,conteudo,legenda,fonte_url,observacoes").eq("id", a.peca_id).maybeSingle();
      if (p) {
        base = `ORIGEM: ${p.modelo === "reels" ? "roteiro de Reels" : "carrossel"} aprovado no Instagram. Expanda o tema em um artigo completo; não reproduza a estrutura de slides ou de falas.
TEMA: ${p.tema || p.titulo}
PILAR: ${p.pilar || "-"}
CONTEÚDO DA PEÇA: ${JSON.stringify(p.conteudo)}
LEGENDA: ${p.legenda || "-"}
${p.fonte_url ? `FONTE DA NOTÍCIA: ${p.fonte_url}\n` : ""}${p.observacoes ? `OBSERVAÇÕES: ${p.observacoes}\n` : ""}`;
        permitidas = [...urlsDe(p.fonte_url), ...urlsDe(p.observacoes), ...urlsDe(p.legenda)];
      }
    }
    if (!base) {
      base = `ORIGEM: pauta enviada pelo advogado.
TEMA: ${a.tema || "-"}
${a.observacoes ? `MATERIAL ENVIADO PELO ADVOGADO:\n${a.observacoes}\n` : ""}${a.pesquisa ? `\nLEVANTAMENTO DE PESQUISA (fatos e fontes):\n${a.pesquisa}\n` : ""}`;
      permitidas = [...urlsDe(a.observacoes), ...urlsDe(a.pesquisa)];
    }
    if (a.observacoes && a.origem === "peca") base += `\nORIENTAÇÕES DO ADVOGADO PARA O ARTIGO: ${a.observacoes}\n`;
    const temParecer = a.conteudo && a.parecer && a.parecer.parecer === "ajustar";
    let msg = base;
    if (a.conteudo && (pedido || temParecer)) {
      msg += `\nVERSÃO ATUAL DO ARTIGO:\n${JSON.stringify({ titulo: a.titulo, slug: a.slug, descricao: a.descricao, resumo: a.resumo, ...a.conteudo })}\n`;
      if (temParecer) msg += `\nPARECER DA TÊMIS (corrija todos os apontamentos):\n${JSON.stringify(a.parecer)}\n`;
      if (pedido) msg += `\nAJUSTE PEDIDO PELO ADVOGADO (prioridade): ${pedido}\n`;
      msg += `\nReescreva o artigo aplicando as correções e mantendo o que já estava bom.`;
    } else msg += `\nEscreva o artigo.`;

    const sistema = SISTEMA_MACHADO + await regrasMachado();
    const schema = estrito(SCHEMA_MACHADO);
    const t0 = Date.now();
    let { r, falha } = await chamar("machado", sistema, msg, schema, undefined, 16000);
    if (!r) return { ok: false, falha: "Machado: " + falha };
    const v = problemasFormato(r);
    // Segunda passada só se houver tempo (a função tem limite de ~150 s); senão, o desvio vai para a conferência do advogado
    if (v.length && Date.now() - t0 < 50000) {
      const seg = await chamar("machado", sistema, msg + `\n\nSUA VERSÃO ANTERIOR:\n${JSON.stringify(r)}\n\nELA NÃO RESPEITOU AS REGRAS DE FORMATO:\n- ${v.join("\n- ")}\n\nAjuste apenas o necessário, mantendo o conteúdo e o sentido.`, schema, undefined, 16000);
      if (seg.r) r = seg.r;
    }
    // Fontes: só links presentes no material recebido
    const ok = new Set(permitidas.map((u) => u.replace(/\/+$/, "")));
    const fontes = (r.fontes || []).filter((f: any) => ok.has(String(f.url || "").replace(/\/+$/, "")));
    const pontos = [...(r.pontos_de_verificacao || [])];
    if ((r.fontes || []).length > fontes.length) pontos.push("Removi do artigo link(s) de fonte que não vieram do material recebido.");
    pontos.push(...problemasFormato(r).map((x) => "Formato: " + x));
    // Endereço: mantém o de artigo já publicado; evita repetir o de outro artigo
    let slug = a.publicado_em && a.slug ? a.slug : (slugificar(r.slug) || slugificar(r.titulo) || "artigo");
    if (!(a.publicado_em && a.slug)) {
      const { data: iguais } = await admin.from("artigos").select("id,slug").like("slug", slug + "%").neq("id", a.id);
      const usados = new Set((iguais || []).map((x) => x.slug));
      let n = 2; const raiz = slug;
      while (usados.has(slug)) slug = `${raiz}-${n++}`;
    }
    const conteudo = { introducao: r.introducao || [], secoes: r.secoes || [], faq: r.faq || [], fontes, pontos_de_verificacao: pontos };
    const { error } = await admin.from("artigos").update({
      titulo: semMarcas(r.titulo).slice(0, 200), slug, descricao: String(r.descricao || "").slice(0, 300), resumo: r.resumo,
      conteudo, palavras: palavrasArtigo(r), status: "escrito", versao: (a.versao || 0) + 1,
      atualizado_em: new Date().toISOString(),
    }).eq("id", a.id);
    if (error) return { ok: false, falha: "Falha ao gravar: " + error.message };
    return { ok: true };
  }

  /* ---------- TÊMIS REVISA ---------- */
  async function revisar(a: any) {
    const c = a.conteudo || {};
    const txt = `TÍTULO: ${a.titulo}
DESCRIÇÃO (Google): ${a.descricao}
RESUMO: ${a.resumo}

INTRODUÇÃO:
${(c.introducao || []).join("\n\n")}

${(c.secoes || []).map((s: any, i: number) => `SEÇÃO ${i + 1} — ${s.titulo}\n${(s.paragrafos || []).join("\n\n")}${(s.itens || []).length ? "\n- " + s.itens.join("\n- ") : ""}`).join("\n\n")}

PERGUNTAS FREQUENTES:
${(c.faq || []).map((f: any, i: number) => `${i + 1}. ${f.pergunta}\n${f.resposta}`).join("\n\n")}

FONTES: ${(c.fontes || []).map((f: any) => f.url).join(" | ") || "(nenhuma)"}`;
    const { data: regras } = await admin.from("aprendizados").select("regra").eq("ativo", true).in("agente", ["temis", "todas"]).order("criado_em");
    const extra = (regras || []).length ? `\n\nREGRAS DEFINIDAS PELO ADVOGADO (têm prioridade):\n${regras!.map((r, i) => `${i + 1}. ${r.regra}`).join("\n")}` : "";
    const { r, falha } = await chamar("temis", SISTEMA_TEMIS + extra, `ARTIGO A REVISAR:\n\n${txt}`, estrito(SCHEMA_TEMIS));
    if (!r) return { ok: false, falha: "Têmis: " + falha };
    r.parecer = String(r.parecer || "").toLowerCase();
    (r.apontamentos || []).forEach((x: any) => { x.gravidade = String(x.gravidade || "").toLowerCase(); });
    if (r.parecer === "aprovado" && (r.apontamentos || []).some((x: any) => x.gravidade === "alta")) r.parecer = "ajustar";
    const registro = { ...r, versao: a.versao, data: new Date().toISOString() };
    const status = r.parecer === "bloquear" ? "bloqueado" : r.parecer === "aprovado" ? "aguardando_voce" : "em_revisao";
    await admin.from("artigos").update({ parecer: registro, historico: [...(a.historico || []), registro], status,
      atualizado_em: new Date().toISOString() }).eq("id", a.id);
    return { ok: true, parecer: r.parecer };
  }

  /* ---------- PUBLICAR / RETIRAR ---------- */
  async function atualizarSite(alvo: any, acao: "publicar" | "retirar") {
    const TOKEN = Deno.env.get("GITHUB_SITE_TOKEN");
    if (!TOKEN) return { ok: false, falha: "A chave do GitHub (GITHUB_SITE_TOKEN) ainda não foi cadastrada no Supabase." };
    const gh = github(TOKEN);
    const agora = new Date().toISOString();
    // No ar: já publicado alguma vez e não retirado nem descartado (inclui artigo publicado que está sendo ajustado)
    const { data: publicados } = await admin.from("artigos").select("*").not("publicado_em", "is", null)
      .not("status", "in", "(retirado,descartado)").neq("id", alvo.id);
    const lista = [...(publicados || [])];
    const alvoFinal = { ...alvo, publicado_em: alvo.publicado_em || agora, atualizado_em: agora };
    if (acao === "publicar") lista.push(alvoFinal);
    lista.sort((x, y) => String(y.publicado_em).localeCompare(String(x.publicado_em)));
    try {
      const m = await moldura(gh);
      const llmsAtual = (await gh.ler("llms.txt")) || "";
      const arquivos: { path: string; content: string | null }[] = [
        { path: "publicacoes/index.html", content: paginaLista(lista, m) },
        { path: "sitemap.xml", content: sitemap(lista) },
        { path: "llms.txt", content: llmsAtualizado(llmsAtual, lista) },
      ];
      if (acao === "publicar") arquivos.push({ path: `publicacoes/${alvo.slug}.html`, content: paginaArtigo(alvoFinal, m) });
      else if (await gh.ler(`publicacoes/${alvo.slug}.html`)) arquivos.push({ path: `publicacoes/${alvo.slug}.html`, content: null });
      const sha = await gh.commitar(arquivos, acao === "publicar"
        ? `conteúdo: publica "${semMarcas(alvo.titulo)}"\n\nPublicado pelo Estúdio de Marketing (Machado).`
        : `conteúdo: retira "${semMarcas(alvo.titulo)}" do site\n\nRetirado pelo Estúdio de Marketing.`);
      await admin.from("artigos").update(acao === "publicar"
        ? { status: "publicado", publicado_em: alvoFinal.publicado_em, commit_sha: sha, atualizado_em: agora }
        : { status: "retirado", commit_sha: sha, atualizado_em: agora }).eq("id", alvo.id);
      return { ok: true, url: `${DOMINIO}/publicacoes/${alvo.slug}`, commit: sha };
    } catch (e) {
      return { ok: false, falha: String(e instanceof Error ? e.message : e) };
    }
  }

  /* ---------- AUDITORIA ---------- */
  async function auditar() {
    const problemas: { pagina: string; tipo: string; detalhe: string }[] = [];
    const pegar = async (u: string) => {
      try { return await fetch(u, { redirect: "manual", headers: { "User-Agent": "EstudioPalacio-Auditoria/1.0" } }); } catch { return null; }
    };
    const sm = await pegar(`${DOMINIO}/sitemap.xml`);
    const xml = sm && sm.status === 200 ? await sm.text() : "";
    if (!xml) problemas.push({ pagina: "/sitemap.xml", tipo: "sitemap", detalhe: `O sitemap não respondeu (status ${sm?.status ?? "sem resposta"}).` });
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1].trim());
    const links = new Map<string, string>();
    for (const u of locs) {
      const caminho = u.replace(DOMINIO, "") || "/";
      const r = await pegar(u);
      if (!r || r.status !== 200) { problemas.push({ pagina: caminho, tipo: "pagina_fora", detalhe: `A página não abriu (status ${r?.status ?? "sem resposta"}).` }); continue; }
      const h = await r.text();
      const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
      if (!t) problemas.push({ pagina: caminho, tipo: "titulo", detalhe: "Sem título." });
      else if (t.length > 70) problemas.push({ pagina: caminho, tipo: "titulo", detalhe: `Título com ${t.length} caracteres; o Google corta acima de ~60.` });
      const d = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
      if (!d) problemas.push({ pagina: caminho, tipo: "descricao", detalhe: "Sem descrição." });
      else if (d.length > 165) problemas.push({ pagina: caminho, tipo: "descricao", detalhe: `Descrição com ${d.length} caracteres; o ideal é até 155.` });
      else if (d.length < 70) problemas.push({ pagina: caminho, tipo: "descricao", detalhe: `Descrição curta (${d.length} caracteres).` });
      const can = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
      if (!can) problemas.push({ pagina: caminho, tipo: "canonical", detalhe: "Sem endereço canônico." });
      else if (can.replace(/\/$/, "") !== u.replace(/\/$/, "")) problemas.push({ pagina: caminho, tipo: "canonical", detalhe: `Canônico aponta para ${can}.` });
      const h1 = (h.match(/<h1[\s>]/g) || []).length;
      if (h1 !== 1) problemas.push({ pagina: caminho, tipo: "h1", detalhe: `${h1} títulos principais (h1); o certo é 1.` });
      if (!h.includes("application/ld+json")) problemas.push({ pagina: caminho, tipo: "dados_estruturados", detalhe: "Sem dados estruturados para o Google." });
      for (const x of h.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) if (!links.has(x[1])) links.set(x[1], caminho);
    }
    for (const [p, origemPag] of links) {
      const r = await pegar(DOMINIO + p);
      if (!r || ![200, 301, 308].includes(r.status)) problemas.push({ pagina: origemPag, tipo: "link_quebrado", detalhe: `Link para ${p} não abre (status ${r?.status ?? "sem resposta"}).` });
    }
    for (const arq of ["/robots.txt", "/llms.txt"]) {
      const r = await pegar(DOMINIO + arq);
      if (!r || r.status !== 200) problemas.push({ pagina: arq, tipo: "arquivo", detalhe: `Não respondeu (status ${r?.status ?? "sem resposta"}).` });
    }
    const resumo = problemas.length
      ? `${locs.length} páginas verificadas; ${problemas.length} ponto(s) de atenção.`
      : `${locs.length} páginas verificadas; tudo em ordem.`;
    await admin.from("auditorias_site").insert({ paginas: locs.length, problemas, resumo });
    return { ok: true, paginas: locs.length, problemas: problemas.length, resumo };
  }

  /* =============== ROTEAMENTO =============== */
  try {
    if (tarefa === "pesquisar") {
      const a = await carregar(corpo.artigo_id); if (!a) return json({ erro: "Artigo não encontrado." }, 404);
      const r = await pesquisar(a); return r.ok ? json({ ok: true }) : json({ erro: r.falha }, 502);
    }
    if (tarefa === "escrever") {
      const a = await carregar(corpo.artigo_id); if (!a) return json({ erro: "Artigo não encontrado." }, 404);
      if (a.status === "publicado" && !corpo.pedido) return json({ erro: "Artigo já publicado: descreva o ajuste desejado." }, 400);
      const r = await escrever(a, corpo.pedido); return r.ok ? json({ ok: true }) : json({ erro: r.falha }, 502);
    }
    if (tarefa === "revisar") {
      const a = await carregar(corpo.artigo_id); if (!a || !a.conteudo) return json({ erro: "Artigo sem texto para revisar." }, 404);
      const r = await revisar(a); return r.ok ? json({ ok: true, parecer: r.parecer }) : json({ erro: r.falha }, 502);
    }
    if (tarefa === "publicar" || tarefa === "retirar") {
      if (origem !== "manual") return json({ erro: "Publicar e retirar exigem o clique do advogado." }, 403);
      const a = await carregar(corpo.artigo_id); if (!a) return json({ erro: "Artigo não encontrado." }, 404);
      if (tarefa === "publicar") {
        if (a.status === "bloqueado") return json({ erro: "A Têmis bloqueou este artigo; ele não pode ser publicado." }, 400);
        if (!a.conteudo || !a.slug) return json({ erro: "O artigo ainda não tem texto." }, 400);
        if (!["aguardando_voce", "publicado"].includes(a.status) && !corpo.forcar)
          return json({ erro: "O artigo ainda tem apontamentos da Têmis. Confirme para publicar mesmo assim.", precisa_confirmar: true }, 409);
      } else if (!a.publicado_em || ["retirado", "descartado"].includes(a.status)) return json({ erro: "Este artigo não está no site." }, 400);
      const r = await atualizarSite(a, tarefa);
      return r.ok ? json(r) : json({ erro: r.falha }, 502);
    }
    if (tarefa === "artigo_auto") {
      const { data: usados } = await admin.from("artigos").select("peca_id").not("peca_id", "is", null);
      const ja = new Set((usados || []).map((x) => x.peca_id));
      const { data: pecas } = await admin.from("pecas").select("id,tema,titulo").in("status", ["aprovada", "publicada"])
        .order("criado_em", { ascending: false }).limit(30);
      const p = (pecas || []).find((x) => !ja.has(x.id));
      if (!p) return json({ ok: true, aviso: "Nenhuma peça aprovada nova para virar artigo." });
      const { data: novo, error } = await admin.from("artigos").insert({ origem: "peca", peca_id: p.id, tema: p.tema || p.titulo }).select("*").single();
      if (error) return json({ erro: error.message }, 500);
      const r = await escrever(novo);
      return r.ok ? json({ ok: true, artigo_id: novo.id }) : json({ erro: r.falha }, 502);
    }
    if (tarefa === "revisar_pendentes") {
      const { data: pend } = await admin.from("artigos").select("*").eq("status", "escrito").order("criado_em").limit(2);
      const res = [];
      for (const a of pend || []) res.push(await revisar(a));
      return json({ ok: true, revisados: res.length });
    }
    if (tarefa === "auditoria") return json(await auditar());
    if (tarefa === "gbp_mes") {
      const mes = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }).slice(0, 7);
      const { data: ja } = await admin.from("gbp_posts").select("id").eq("mes", mes);
      if ((ja || []).length && !corpo.forcar) return json({ ok: true, aviso: "O post deste mês já foi sugerido." });
      const { data: art } = await admin.from("artigos").select("titulo,resumo,descricao,slug,conteudo").eq("status", "publicado").order("publicado_em", { ascending: false }).limit(1);
      let base = "", fonte = "";
      if ((art || []).length) {
        const a = art![0];
        base = `ARTIGO: ${a.titulo}\nRESUMO: ${a.resumo}\nINTRODUÇÃO: ${(a.conteudo?.introducao || []).join(" ")}`;
        fonte = `${DOMINIO}/publicacoes/${a.slug}`;
      } else {
        const { data: pc } = await admin.from("pecas").select("titulo,legenda").in("status", ["aprovada", "publicada"]).order("criado_em", { ascending: false }).limit(1);
        if (!(pc || []).length) return json({ ok: true, aviso: "Sem material aprovado para o post do mês." });
        base = `PEÇA DO INSTAGRAM: ${pc![0].titulo}\nLEGENDA: ${pc![0].legenda}`;
        fonte = `${DOMINIO}/recuperacao-de-credito`;
      }
      const { r, falha } = await chamar("machado_gbp", SISTEMA_GBP, base, undefined, undefined, 1200);
      if (!r) return json({ erro: "Machado: " + falha }, 502);
      await admin.from("gbp_posts").insert({ mes, texto: r, base: fonte });
      return json({ ok: true });
    }
    return json({ erro: "Tarefa desconhecida." }, 400);
  } catch (e) {
    return json({ erro: "Erro inesperado: " + String(e instanceof Error ? e.message : e) }, 500);
  }
});
