# ESPECIFICAÇÃO — Estúdio de Marketing com Agentes de IA

**Projeto:** Estúdio de Marketing — Palácio Gomes Advocacia
**Endereço:** `marketing.palaciogomes.com.br`
**Versão do documento:** 1.3 — 12/10/2026 (foco no gestor escolar, casos ilustrativos, checklist OAB conferido, prompt do Rondon)
**Status:** Etapas 0–3 aprovadas; Etapa 4 (Radar do Rondon) publicada como v005 em 12/10/2026, aguardando aceite. Próxima prevista: Glauber (Reels, com João e Giovanna).

---

## 1. Objetivo

Criar um site separado do SENESCAL onde uma equipe de agentes de IA produz conteúdo para o Instagram do escritório (`@palaciogomes.adv`). O trabalho dos agentes vai da pauta ao carrossel pronto em PNG. Nada é publicado sem aprovação humana.

**Fora do escopo:**
- publicação automática;
- outras redes além do Instagram;
- qualquer dado de devedor ou de processo;
- qualquer integração com o SENESCAL.

## 2. Decisões já tomadas

| Item | Decisão |
|---|---|
| Endereço | `marketing.palaciogomes.com.br` |
| Rede | Somente Instagram |
| Publicação | Manual: você baixa as peças aprovadas e posta |
| Identidade | Manual de marca 2018 + cores atuais do site (ver §4) |
| Separação | Repositório, banco (Supabase) e hospedagem **próprios**, sem compartilhar nada com o SENESCAL |

## 3. Público e linha editorial

O conteúdo tem três frentes:
1. **Modelagem de conteúdo:** padrões de referências analisados pelo Rondon.
2. **Comunicação direta com o credor**, em especial o **diretor ou dono de escola particular**.
3. **Casos ilustrativos**, no formato permitido pela OAB (§3.1).

- **Público principal:** diretor(a) ou mantenedor(a) de escola particular de pequeno e médio porte.
- **Público secundário:** gestores de clínicas e empresas com carteira de recebíveis.
- **Público que não é alvo:** o devedor. O conteúdo nunca fala com ele nem o expõe.
- **Pilares de conteúdo:**
  1. **Gestão de Inadimplência:** o carro-chefe.
  2. **Diálogo com o Gestor Escolar:** dores, decisões e rotina do diretor, como rematrícula, relação com as famílias, caixa e equipe.
  3. **Gestão de Contratos:** prevenção, com cláusulas, garantias e títulos.
  4. **Relações Consumeristas:** o que pode e o que não pode na cobrança.
  5. **Casos Ilustrativos:** ver §3.1.
  6. Relações Societárias e Gestão Sucessória: conteúdo eventual.
- **Tom:** técnico, sóbrio e didático, mas próximo do diretor. Fala de gestor para gestor, coerente com o slogan "Defensores incansáveis do seu negócio".

### 3.1 Estudos de caso: o que a OAB permite

**Análise fria:** estudo de caso com caso real e resultado é **vedado**. O Provimento 205/2021 proíbe:
- a menção a "decisões judiciais e resultados de qualquer natureza" (art. 4º, § 2º);
- o uso de "casos concretos ou apresentação de resultados" em vídeos (art. 5º, § 3º);
- casos concretos para oferta de serviços e promessa de resultado (art. 6º);
- na criação de conteúdo, a divulgação de "resultados concretos obtidos, clientes, valores" (Anexo Único).

Além disso, o sigilo profissional impede expor a situação de um cliente, mesmo sem citar o nome.

**Formato permitido, chamado "Caso Ilustrativo":**
- A situação é **hipotética e declarada como tal** no próprio post ("Situação ilustrativa, baseada em dúvidas comuns de gestores escolares").
- O foco é a **análise e a decisão**: o que a lei diz, quais caminhos existem, que erro evitar. Nunca o resultado ("recuperamos X", "em Y dias").
- Não pode ser reconhecível como cliente real. A Clarice não recebe nenhum dado de cliente; os casos são construídos do zero.
- Sem valores obtidos, percentuais de êxito, prazos de recuperação ou depoimentos de clientes.
- A Têmis bloqueia automaticamente qualquer peça do pilar 5 sem a declaração de situação ilustrativa.

## 4. Kit de marca

### 4.1 Cores

| Token | Hex | Origem | Uso |
|---|---|---|---|
| `--petroleo` | `#0D507B` | Site atual | Fundo principal das capas e fechamentos |
| `--profundo` | `#0A3D5E` | Derivado | Degradê do fundo escuro |
| `--nevoa` | `#5B88A6` | Caracol do site | Fios, rótulos e detalhes sobre fundo claro |
| `--ceu` | `#A9CBE3` | Derivado | Destaques de texto sobre fundo escuro |
| `--indigo` | `#292465` | Logotipo (manual 2018: C100 M96 Y35 K29) | Logo e ícones sobre fundo claro |
| `--gelo` | `#F3F5F8` | Derivado | Fundo dos slides de conteúdo |
| `--grafite` | `#1A2230` | Derivado | Texto corrido |

**Observação:** o site usa o petróleo (`#0D507B`) e o logotipo continua em índigo (`#292465`). A convivência funciona, desde que o logo índigo fique só sobre fundo claro. Sobre o petróleo, usa-se sempre a versão branca.

### 4.2 Tipografia — DECIDIDO

- **Títulos:** Cormorant Garamond (600). Serifa clássica, próxima do desenho do logotipo, e gratuita (licença SIL Open Font), o que dispensa licença comercial.
- **Texto:** Roboto Slab (300/400). É a fonte que o manual de marca indica para a papelaria e lê bem na tela do celular.
- **Regra de uso:** a Cormorant só aparece em tamanho grande (títulos ≥ 64 px), porque os traços finos dela somem em tamanho pequeno. Todo texto corrido, rótulo e rodapé usa a Roboto Slab.

### 4.3 Elementos gráficos

- Caracol (espiral) como marca d'água nas capas e como marcador de lista.
- Coluna como marca d'água discreta (5% de opacidade) nos slides claros, repetindo o padrão do site.
- Formato: **1080 × 1350 px** (retrato 4:5, o que mais ocupa a tela no feed).

### 4.4 Arquivos vetoriais — RESOLVIDO

A partir dos SVGs enviados (logomarca, caracol, cartões, papel timbrado, pasta), foram gerados recortados e limpos:

| Arquivo | Uso |
|---|---|
| `logo-indigo.svg` | Fundo claro (cores originais: coluna `#313157`, letras `#333d7c`) |
| `logo-branco.svg` | Fundo escuro |
| `coluna-indigo.svg` | Marca d'água nos slides claros |
| `caracol-branco.svg` / `caracol-indigo.svg` | Marca d'água e marcador de lista |

**Observações:**
- O SVG da logomarca não traz a palavra "ADVOGADOS". O carrossel usa apenas "PALÁCIO", como no cartão de visitas.
- Os cartões e a pasta têm um padrão de fundo com colunas e caracóis. Ele pode virar textura opcional das capas na Etapa 1.

## 5. A equipe de agentes

Os três agentes de comando (Péricles, Atena, Têmis) têm nomes gregos, coerentes com a coluna do logotipo. Os agentes de produção têm nomes de grandes brasileiros ligados ao ofício de cada um.

```
                      PÉRICLES (Gestor) ──►  você (Mesa de Deliberações, toda manhã)
                              │
     ┌──────────────┬─────────┴────┬───────────────┬──────────────┐
  ATENA          RONDON         CLARICE         GLAUBER         TÊMIS
  Estrategista   Analista de    Redatora        Roteirista     Revisora OAB
  (pauta)        Referências    (carrossel      (Reels)        (barreira
                                 + legenda)                     obrigatória)
                                      │
                               TARSILA (módulo de arte, sem IA:
                               aplica o texto nos modelos da marca)
```

| Nome | Função | Por que o nome | Recebe | Entrega | Autonomia |
|---|---|---|---|---|---|
| **Péricles** | Gestor | O estadista que coordenava Atenas | Tudo o que está pendente | Briefing matinal + fila de decisões | Organiza; não decide |
| **Atena** | Estrategista | Deusa da estratégia | Pilares, calendário, desempenho, referências | Pauta semanal (2 posts): tema, pilar, formato, ângulo | Rascunha; você aprova a pauta |
| **Rondon** | Analista de Referências | Cândido Rondon, o explorador que mapeou o interior do Brasil | Perfis e links cadastrados por você | Relatório de temas, formatos e ganchos (nunca cópia) | Só observa e relata |
| **Clarice** | Redatora | Clarice Lispector, mestra da palavra escrita | Item de pauta aprovado | Texto de cada slide + legenda + hashtags (JSON) | Rascunha |
| **Glauber** | Roteirista | Glauber Rocha, cineasta ("uma câmera na mão e uma ideia na cabeça") | Item de pauta (Reels) | Roteiro: gancho, falas, cortes, texto de tela | Rascunha |
| **Têmis** | Revisora OAB | Deusa da justiça e da ordem | Toda peça, antes de chegar a você | Parecer: aprovado / ajustar (trecho + motivo) / bloquear | Pode **barrar**, nunca aprovar sozinha |
| **Tarsila** | Módulo de arte (sem IA) | Tarsila do Amaral, pintora | Texto aprovado da Clarice | Slides PNG 1080×1350 + ZIP | Automático, sem custo de IA |

**Por que a Tarsila não é IA:** o desenho é fixo, feito pelos modelos da marca. A Clarice entrega o texto em campos (título, itens, fundamento legal) e a Tarsila encaixa esse texto no modelo. É isso que garante que todo carrossel saia com a mesma qualidade. Gerar imagem por IA fica fora do escopo.

### 5.0 Modelo de IA por agente

| Agente | Modelo | Motivo |
|---|---|---|
| Clarice, Glauber, Atena, Rondon | Claude Sonnet 5.5 | Boa escrita, custo médio |
| Têmis | Claude Opus 5.5 | É a barreira jurídica; aqui vale pagar pelo modelo mais rigoroso |
| Péricles | Claude Haiku 5.5 | Só resume pendências; o modelo mais barato basta |

O modelo de cada agente fica numa configuração e pode ser trocado sem reprogramar.

### 5.1 Checklist do Revisor OAB

Base: Código de Ética e Disciplina da OAB e Provimento 205/2021 (artigos conferidos no texto oficial em 12/10/2026). **O texto final do checklist deve ser validado por você antes da Etapa 2.** Itens:

1. Promessa ou sugestão de resultado ("recuperamos X%", "garantimos").
2. Menção a clientes, casos concretos, valores obtidos ou números de processo.
3. Linguagem de captação ou de mercantilização ("contrate já", preço, "consulta grátis", urgência artificial).
4. Comparação com outros escritórios ou autopromoção ostensiva.
5. Sensacionalismo ou exploração de temas para atrair clientela.
6. Afirmação jurídica sem fundamento legal indicado, ou com fundamento desatualizado.
7. Ausência da ressalva informativa no slide final.
8. Caso concreto, decisão judicial ou resultado (arts. 4º, § 2º, 5º, § 3º, 6º). No pilar "Casos Ilustrativos", falta da declaração de situação hipotética.
9. Expressões persuasivas, de autoengrandecimento ou de comparação (art. 3º, IV), e incitação direta ao litígio ou à contratação (art. 3º, § 1º).
10. Convite a consultas jurídicas individuais nos comentários ou no direct ("mande sua dúvida que respondemos"): risco de responder consulta com habitualidade em meio de comunicação.
11. Conteúdo que exponha, ridicularize ou estereotipe devedores (CDC, art. 42; identidade de "cobrança humanizada").

**Segunda trava, de exatidão jurídica:** todo artigo de lei citado precisa vir acompanhado de lei, artigo e redação. A pergunta "isso está correto e vigente?" é sempre sua, pois o agente pode errar.

### 5.2 Aprendizado

Toda rejeição ou edição sua grava um motivo na tabela `aprendizados`, por exemplo: "evitar a palavra 'calote'", "não usar exemplo com valores". Esses motivos entram nas instruções dos agentes nas execuções seguintes. É assim que o sistema melhora sem reprogramação.

## 6. Fluxo de uma peça

```
Pauta aprovada → Redator → Revisor OAB ──(ajustar)──► Redator (máx. 2 voltas)
                                │
                           (aprovado)
                                ▼
                 Fila de Deliberação (você) ── rejeita c/ motivo → aprendizados
                                │
                            aprova
                                ▼
                 Render dos slides (PNG) → download ZIP → você publica
                                ▼
                 Você informa "publicado em DD/MM" (+ métricas depois)
```

**Estados da peça:** `rascunho` → `em_revisao` → `aguardando_voce` → `aprovada` → `publicada` (ou `rejeitada`).

## 7. Arquitetura

| Camada | Escolha | Observação |
|---|---|---|
| Interface | `index.html` único, sem framework (mesmo padrão do SENESCAL) | Cloudflare Pages (recomendado) ou Vercel; subdomínio próprio |
| Banco e login | **Novo** projeto Supabase (região São Paulo) | Login só para você e a Giovanna; RLS em tudo |
| Agentes | Edge Functions chamando a API da Anthropic | Cada agente é **uma chamada curta**, encadeada por fila no banco. Evita o limite de tempo das Edge Functions |
| Agendamento | pg_cron | Pauta na segunda de manhã; briefing do Gestor diário às 7h |
| Renderização | No navegador: o modelo HTML vira PNG e é baixado em ZIP | Dispensa servidor de imagens |
| Segredos | `ANTHROPIC_API_KEY` nos Secrets do Supabase | Inserida por você, nunca colada no chat |

### 7.1 Tabelas

| Tabela | Conteúdo |
|---|---|
| `perfis` | Usuários (você, Giovanna) |
| `marca` | Configuração única: cores, fontes, ressalva, @ do perfil |
| `pilares` | Pilares editoriais e peso de cada um |
| `pautas` | Itens de pauta: tema, pilar, formato, data prevista, status |
| `pecas` | Carrossel ou roteiro: conteúdo em JSON, legenda, status, modelo usado |
| `revisoes` | Pareceres do Revisor OAB por versão da peça |
| `referencias` | Perfis e links de concorrentes cadastrados + análise |
| `deliberacoes` | Sua fila de decisões: aprovar, editar, rejeitar e motivo |
| `aprendizados` | Regras extraídas das suas decisões |
| `agente_execucoes` | Livro-ponto: agente, entrada, saída, duração, tokens e custo |

### 7.2 Custo estimado (2 posts por semana)

**Preços da API da Anthropic** (outubro/2026, em dólares por milhão de tokens; 1 token ≈ ¾ de palavra):

| Modelo | Entrada | Saída |
|---|---|---|
| Sonnet 5.5 | US$ 2 | US$ 10 |
| Opus 5.5 | US$ 4 | US$ 20 |
| Haiku 5.5 | US$ 0,10 | US$ 0,50 |

Pesquisa na web (Atena): US$ 10 por 1.000 buscas.

**Premissas:** ~9 posts publicados por mês. Contam-se ~12 peças redigidas, porque algumas você vai rejeitar. Cada peça tem até 2 voltas entre Clarice e Têmis. As instruções de cada agente (manual de marca, checklist, aprendizados) somam ~6–10 mil tokens por chamada.

| Item | Conta | Custo/mês |
|---|---|---|
| Clarice (redação) | 12 peças × 2 voltas × (8 mil entrada + 2,5 mil saída) | ≈ US$ 1,00 |
| Têmis (revisão OAB, Opus) | 12 peças × 2 voltas × (10 mil entrada + 1,5 mil saída) | ≈ US$ 1,70 |
| Atena (pauta semanal + ~10 buscas) | 4,3 semanas × US$ 0,20 | ≈ US$ 0,90 |
| Rondon (referências) | 3–5 perfis/mês, com prints | ≈ US$ 1,00 |
| Glauber (Reels, se usado) | ~4 roteiros | ≈ US$ 0,40 |
| Péricles (briefing diário, Haiku) | 30 × (10 mil + 1 mil) | ≈ US$ 0,05 |
| **Total estimado** | | **≈ US$ 5 a 6/mês** |

**Leitura honesta da estimativa:**
- O custo de IA é baixo. O que pesa neste projeto é o tempo de desenvolvimento e o seu tempo de aprovação, não a API.
- A estimativa pode errar para mais ou para menos em até 2–3 vezes, dependendo do tamanho real das instruções e de quantas voltas de revisão houver. O valor real será medido na Etapa 2.
- **Teto definido: US$ 12/mês** (≈ o dobro da estimativa). O Péricles avisa ao atingir 75% (US$ 9). Ao chegar no teto, todos os agentes param até o mês seguinte ou até você liberar manualmente.
- **Proteção adicional:** configurar o mesmo limite no próprio painel da Anthropic, para que nem um erro de programação ultrapasse o valor.
- A API da Anthropic funciona com **créditos pré-pagos** e uma conta própria, separada da sua assinatura do Claude.

**Infraestrutura (situação atual: Vercel e Supabase no plano gratuito):**

- **Vercel Hobby.** Os termos restringem o plano gratuito a uso pessoal não comercial. Uso comercial é definido como qualquer projeto voltado ao ganho financeiro de quem está envolvido. Um estúdio de marketing do escritório se enquadra nessa definição, e o SENESCAL também. Na prática, a Vercel raramente fiscaliza ferramentas internas pequenas, mas o risco existe: em caso de violação, ela pode suspender a conta inteira, inclusive o SENESCAL. Há duas saídas:
  - **(a) Vercel Pro**, cerca de US$ 20/mês;
  - **(b) Cloudflare Pages**, gratuito e com uso comercial permitido. Atende ao Estúdio, que é uma página estática e usa o Supabase para o resto.
  - **Recomendação:** (b) para o Estúdio. Isso também tira o SENESCAL de uma exposição maior na mesma conta.
  - **Decisão (12/10/2026):** Vercel, por escolha do João.
- **Supabase Free.**
  - Permite **2 projetos ativos**. O SENESCAL e o Estúdio ocupam as duas vagas.
  - O projeto **pausa após 1 semana sem atividade**. Com o uso de 2 posts por semana, isso não deve ocorrer.
  - **Não inclui backup automático.** Para o Estúdio, o impacto é baixo. Para o SENESCAL é um risco relevante (ver nota abaixo).

**Nota fora do escopo, mas importante:** o SENESCAL roda em produção com dados financeiros e processuais no plano gratuito do Supabase, que **não faz backup automático**. Se houver um erro grave no banco, não existe cópia de segurança para restaurar. Recomendo resolver isso independentemente do Estúdio: assinar o Supabase Pro (a partir de US$ 25/mês, com backups diários) ou, no mínimo, montar uma exportação semanal manual.

## 8. Análise de concorrentes: limites

- **Proibido:** raspagem do Instagram (viola os termos da Meta) e cópia de peças (direito autoral).
- **Fase 1:** você ou a Giovanna colam links, prints ou legendas de posts relevantes, e o Analista estuda.
- **Fase 2 (a confirmar):** a API oficial da Meta ("Business Discovery") permite consultar dados públicos de contas comerciais: posts, legendas, curtidas, comentários. Exige que o Instagram do escritório seja conta profissional vinculada ao app da Meta, e as condições atuais precisam ser verificadas antes da Etapa 4.
- **Regra do agente:** extrair padrões (tema, formato, gancho, frequência), nunca reproduzir textos.
- **Instruções do Rondon:** documento próprio, `PROMPT_rondon_analise_referencias.md`. Inclui o filtro ético-OAB obrigatório e a "Ficha para a Atena".
- **Entrada de vídeos:** a API não assiste vídeo. O Rondon trabalha sobre a transcrição colada e até 5 prints. Transcrição automática exige um serviço à parte, avaliado depois.

## 9. Etapas de implementação

Cada etapa só começa depois do seu "podemos seguir" na anterior.

### Etapa 0 — Infraestrutura ✅ publicada (aguardando o teste de login)

**Registro da implantação (12/10/2026):**

| Item | Valor |
|---|---|
| GitHub | `joaopdsg1/estudio-marketing` (privado, branch `principal`) |
| Vercel | projeto `estudio-marketing` (`prj_eWjTxuUJObFY8hEKRG7F8nuUOpBP`) + domínio `marketing.palaciogomes.com.br` (CNAME no Registro.br) |
| Supabase | organização "Marketing Senescal", projeto "Senescal Marketing" (`wffbncqvhnocdalaoqcv`, São Paulo) |
| Banco | tabela `perfis` com RLS, `eh_gestor()` e gatilho de criação de perfil; cadastro público desligado |
| Usuário | `contato@palaciogomes.com.br`, papel gestor |

- Repositório novo no GitHub, hospedagem (Cloudflare Pages ou Vercel), registro DNS do subdomínio, novo projeto Supabase e login.
- **Aceite:** `marketing.palaciogomes.com.br` abre uma tela de login, você entra e vê uma página vazia com o marcador de versão no console.

### Etapa 1 — Kit de marca e modelos (ainda sem IA) ✅ publicada como v002 (aguardando o teste do João)

Entregue: 3 modelos (Lista, Pergunta e Resposta, Mito × Fato), editor com prévia, aviso de texto excedente, rascunhos (tabela `pecas`), ZIP com PNG 1080×1350 e a legenda em .txt. O contrato JSON do conteúdo está documentado no README do repositório.
- Três modelos de carrossel: **Lista** (o protótipo), **Pergunta e Resposta** e **Mito × Fato**. Mais a capa e o fechamento padrão.
- Editor manual: você digita os textos e o sistema monta, com pré-visualização e download em ZIP.
- **Aceite:** gerar o carrossel-protótipo pelo sistema, idêntico ao aprovado, em 1080×1350.

### Etapa 2 — Redator + Revisor OAB
- Tela "Nova peça": tema → Redator → Revisor → Fila.
- **Aceite:** 5 peças geradas. Nenhuma passa com promessa de resultado (testado com uma pauta propositalmente problemática). O custo por peça fica registrado.

### Etapa 3 — Estrategista + Gestor ✅ publicada (v004)

Entregue: função `rotina` (Atena com Sonnet 5.5; Péricles com Haiku 5.5) e agendamentos pg_cron (pauta toda segunda às 6h30; resumo seg–sex às 7h, horário de Brasília). O agendador se autentica por um segredo gerado aleatoriamente e guardado no Vault, que ninguém precisa conhecer. A Mesa mostra o resumo com indicadores e a pauta da semana, com "Aprovar e produzir" (dispara Clarice→Têmis) e "Descartar". Custo real: Atena ≈ US$ 0,01 por pauta; Péricles ≈ US$ 0,001 por resumo.
- Pauta semanal automática e Mesa de Deliberações com briefing diário.
- **Aceite:** na segunda de manhã há uma pauta da semana aguardando aprovação. Todo dia às 7h, o briefing lista as pendências.

### Etapa 4 — Radar do Rondon ✅ publicada (v005)

Reformulada a pedido do João (12/10/2026): o Rondon passou a ser o pesquisador semanal.
- **Radar toda segunda (5h–5h20):** casos públicos (famosos, empresários, pessoas públicas), números e pesquisas sobre inadimplência e endividamento, setores (educação e pós-pagos). Busca na web só em fontes confiáveis editáveis. Só entra item cujo link apareceu de fato na pesquisa.
- **Atena (6h30)** usa o Radar e liga a pauta à notícia de origem. "Virar pauta" também pode ser feito à mão.
- **Casos públicos:** a notícia é o gancho, com fonte; estratégia possível em tese, com dispositivo; nada de opinião sobre mérito, devedor ou advogados das partes; sem convite ao escritório. O fechamento genérico "Cada caso exige análise de um advogado especializado em recuperação de crédito" é permitido. A Têmis tem o item 12 para isso.
- **Estilo:** a Clarice recebe o trecho explicativo do texto do blog do João como amostra de tom.
- **Perfis de referência:** cadastro manual + sugestões mensais do Rondon (aceitar/recusar).
- **Custo real:** ≈ US$ 0,20–0,33 por categoria pesquisada (≈ US$ 0,85 por semana, ≈ US$ 3,70 por mês).
- **Limitação conhecida:** Estadão e UOL bloqueiam o robô de pesquisa e ficam desativados.

### v012 — Referências que performaram ✅ publicada (aguardando o acesso da Meta)
- Decisão do João (15/10/2026): prioridade é mapear o que deu certo (curtidas, comentários, views), sem descartar os links de sites; YouTube fica para depois.
- Coleta mensal (dia 1º, 7h30) ou manual: para cada perfil de Instagram ativo, Business Discovery da Meta (só contas profissionais; compartilhamentos e salvamentos não são públicos). Desempenho = curtidas + 3×comentários + views/20, dividido pela mediana do próprio perfil; 5 destaques por perfil nos últimos 180 dias.
- Rondon (Sonnet) analisa destaques + posts colados à mão: padrões (tema × forma), como adaptar à OAB, 3 a 5 sugestões de carrossel; nunca copia texto. Sugestão vira pauta com um clique; a Atena recebe padrões e sugestões na pauta semanal.
- Requisitos: conta profissional do escritório ligada a uma Página do Facebook; app no Meta for Developers; token (Página, sem expiração) no Secret `META_TOKEN`.

### Etapa 4 (original) — Analista de Referências
- Cadastro manual de referências e relatório. Integração com a Meta só se a verificação do §8 for positiva.
- **Aceite:** relatório comparativo de pelo menos 3 perfis, sem nenhum trecho copiado.

### Etapa 5 — Glauber, roteiros de Reels ✅ publicada (v006)

Desenhada com o João em 12/10/2026.
- **Frequência:** 2 carrosséis + 1 Reels por semana. João e Giovanna gravam os 4 ou 5 vídeos do mês num único dia (data marcada no site).
- **Formato:** sempre estudo de caso a partir de notícia do Radar (não dicas). Blocos: gancho (veículo e mês, nunca "esta semana") → problema do credor e ponte com a escola → estratégia em tese, com dispositivo → fechamento que eleva a consciência do gestor sobre os riscos da cobrança sem técnica, terminando com "Cada caso exige análise de um advogado especializado em recuperação de crédito."
- **Conscientização × captação:** mostrar riscos e complexidade é permitido; "contrate", "terceirize com a gente", comparação escola × escritório, promessa ou medo para empurrar a contratação são vedados (Prov. 205/2021, art. 3º, §1º). A Têmis ganhou o item 13 para isso.
- **Pauta mensal (Atena):** dia 1º às 6h40, 5 casos do Radar das últimas 6 semanas ainda não usados em Reels, com formato (João, Giovanna ou dupla), duração (30/45/60 s) e urgência ("atemporal" ou "postar logo"). Botão "Aprovar e roteirizar todas".
- **Glauber (Sonnet 5.5):** fala exata, tópicos, segundos, texto na tela, sugestão de imagem, capa e legenda com fonte. Validação automática de tempo (2,5 palavras/s), soma de segundos, apresentadores, fecho e capa; o que sobrar vira ponto de verificação.
- **Site:** página "Glauber · Reels" (data de gravação, pauta do mês, lista, roteiro avulso, "Virar Reels" no Radar); editor com contador de tempo; capa 1080 × 1920 da Tarsila (liberada após aprovação); roteiro em .txt; teleprompter com lote de gravação, rolagem ajustável, texto exato ou tópicos, espelhar, "marcar como gravado"; datas de postagem semanais às quartas, "postar logo" primeiro.
- **Péricles:** o resumo mostra Reels a decidir, roteiros prontos para gravar e avisa quando a gravação estiver a 3 dias ou menos, e quando há Reels para postar no dia.
- **Custo real:** Atena (pauta de Reels) ≈ US$ 0,04. Roteiro revisado estimado em US$ 0,15–0,25 (≈ US$ 1 por mês).
- **Aceite:** um lote real roteirizado, revisado pela Têmis e lido no teleprompter pelo João.

### v007 — Instruções da equipe ✅ publicada
- Tela "Instruções": regras permanentes por agente (Clarice, Glauber, Têmis, Atena, Rondon ou todos). Criar, editar, desligar e religar; mostra de qual peça a regra veio. Só o gestor altera.
- As regras entram nas instruções de cada agente em toda tarefa, sem custo extra. O Rondon passou a recebê-las no Radar.
- Ao rejeitar uma peça, "transformar em regra" agora vem desmarcado: pedidos sobre uma peça só não devem virar regra permanente.
- Ajustes estruturais (novos formatos, instruções-base, agendamentos) continuam pelo Claude.

### v008 — Texto justificado ✅
- Parágrafos dos slides (resposta da Pergunta e texto do fechamento) justificados, última linha à esquerda, hifenização automática onde o navegador suporta.

### v009 — Design do mês (Tarsila) ✅ publicada
- Decisão do João (13/10/2026): 1 variação por mês; a Tarsila propõe todo mês, mas a troca só acontece quando ele aprova.
- Variação dentro da identidade (cores, fontes, logo e elementos fixos). Parâmetros: fundo, elemento e posição da marca-d'água de capa, conteúdo e fechamento; posição e tamanho do título; fio; numeração; marcador dos itens; rótulo em texto ou etiqueta; conteúdo claro, escuro ou alternado.
- Prévia com o último carrossel aprovado nos 3 modelos, ao lado do design em uso. Aprovar, recusar (motivo opcional) ou pedir outra proposta com instrução.
- Biblioteca de designs aprovados; cada peça guarda o seu design (as antigas não mudam); seletor de design por peça na Tarsila.
- Agendamento: dia 1º às 6h50. Péricles avisa quando há proposta. Custo ≈ US$ 0,02 por proposta.

### v010 — Retomar produção interrompida ✅
- Problema real (13/10/2026): 5 pautas aprovadas de uma vez pararam no meio porque o ciclo redator → Têmis é comandado pela página aberta.
- Correção: peças em produção/revisão sem atualização há mais de 10 minutos aparecem como paradas na Fila (e em Reels) com botão "Retomar"; a retomada continua do ponto exato (escrever, revisar ou ajustar) respeitando o limite de 2 voltas; a pauta de origem passa a "produzida".
- Aviso fixo "Agentes trabalhando… não feche" e alerta do navegador ao tentar fechar. O Péricles cita as peças paradas.
- Mover o ciclo inteiro para o servidor fica como opção futura (limite de tempo por execução no plano gratuito).

### Etapa 6 — Escritório (painel visual) ✅ publicada (v011)
- Aba "Escritório": 7 postos com personagens em pixel originais, luz verde quando o agente trabalhou nos últimos 90 s, vermelha em erro, frase com a última tarefa, tarefas e custo do dia; Péricles no posto central com o resumo do dia; lista das últimas 15 atividades. Lê `agente_execucoes` e atualiza a cada 15 s. Clicar no posto abre a tela do agente.

## 10. Decisões

**Tomadas em 12/10/2026:**
- Aprovação e publicação: só você, manualmente.
- Fontes: Cormorant Garamond + Roboto Slab (§4.2).
- Frequência: 2 posts por semana.
- Nomes dos agentes: Péricles, Atena, Têmis (gregos); Rondon, Clarice, Glauber, Tarsila (brasileiros) (§5).
- Teto de custo de IA: US$ 12/mês (§7.2).
- Arquivos vetoriais recebidos e tratados (§4.4).

- Visual do carrossel-protótipo: **aprovado**.
- Hospedagem: **Vercel** (decisão do João, ciente do risco descrito no §7.2).
- Foco editorial: diretor ou dono de escola + casos ilustrativos (§3).
- Reels: 1 por semana, estudo de caso com gancho de notícia, gravação mensal em lote por João e Giovanna; vídeos também elevam a consciência do gestor sobre a cobrança especializada, sem incitar a contratação.

**Em aberto:**
1. Texto final do checklist OAB (§5.1). Pode ser validado durante a Etapa 2.
