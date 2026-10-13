# Estúdio de Marketing — Palácio Gomes Advocacia

Site interno, separado do SENESCAL, onde agentes de IA produzem conteúdo para o Instagram `@palaciogomes.adv`. A aprovação e a publicação são sempre manuais.

- **Endereço:** https://marketing.palaciogomes.com.br
- **Hospedagem:** Vercel (deploy automático a cada merge na branch principal)
- **Banco e login:** Supabase, projeto `Senescal Marketing` (`wffbncqvhnocdalaoqcv`, São Paulo), organização própria
- **Especificação:** `ESPECIFICACAO_estudio_marketing.md` (no projeto SENESCAL do Claude)

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `index.html` | Aplicação inteira: HTML, CSS e JS, sem framework |
| `assets/` | Logos e caracol em SVG |
| `assets/fonts/` | Cormorant Garamond e Roboto Slab (licença SIL OFL) |
| `supabase/functions/rotina/` | Edge Function agendada: pauta semanal e pauta mensal de Reels (Atena), resumo do dia (Péricles) e Radar (Rondon). Autenticada por segredo no Vault (agendador) ou por usuário logado |
| `supabase/functions/agente/` | Edge Function dos redatores e da revisora (Clarice, Glauber e Têmis): instruções, saída estruturada, teto de custo, registro de execuções |

## Versões

| Versão | Etapa | Conteúdo |
|---|---|---|
| v001 | 0 | Infraestrutura, login e painel com a equipe de agentes (inativos) |
| v002 | 1 | Tarsila: 3 modelos de carrossel (Lista, Pergunta e Resposta, Mito × Fato), editor manual, prévia, aviso de texto excedente, rascunhos (tabela `pecas`), exportação PNG 1080×1350 em ZIP |
| v003 | 2 | Clarice (redação) e Têmis (revisão OAB) via Edge Function `agente`; Fila de peças; painel de revisão com aprovar / reescrever / nova revisão / rejeitar; aprendizados; consumo do mês e teto de US$ 12 |
| v004 | 3 | Atena (pauta semanal, segunda 6h30) e Péricles (resumo do dia, seg–sex 7h) via Edge Function `rotina` + pg_cron; Mesa com resumo, pauta da semana (aprovar e produzir / descartar) |
| v009 | — | Design do mês: a Tarsila propõe 1 variação por mês (dia 1º, 6h50) dentro da identidade (15 parâmetros de composição); prévia com conteúdo real; aprovar, recusar ou pedir outra; biblioteca de designs; cada peça guarda o design com que foi feita (`pecas.design_id`, tabela `designs`) |
| v008 | — | Parágrafos dos slides (resposta da Pergunta e texto do fechamento) justificados, com hifenização automática onde o navegador suporta |
| v007 | 5+ | Instruções da equipe: regras permanentes por agente (Clarice, Glauber, Têmis, Atena, Rondon ou todos), com criar, editar, desligar e religar; Rondon passa a receber regras; rejeitar não vira regra por padrão |
| v006 | 5 | Glauber: roteiros de Reels (estudo de caso a partir do Radar, 30/45/60 s, João, Giovanna ou dupla); pauta mensal de Reels da Atena (dia 1º, 6h40); Têmis item 13 (conscientização × captação); teleprompter com lote de gravação; capa 1080 × 1920 da Tarsila; datas de postagem semanais; Péricles avisa a gravação |
| v005 | 4 | Rondon: Radar semanal (casos públicos, números, setores) com pesquisa na web restrita a fontes confiáveis e links verificados; perfis de referência; Atena usa o Radar; Clarice com o estilo do João e regras de casos públicos; Têmis item 12 |

## Contrato do conteúdo de um carrossel (`pecas.conteudo`)

O mesmo formato será preenchido pela agente Clarice na Etapa 2.

```json
{
  "capa": {"kicker": "...", "titulo": "... *ênfase* ..."},
  "slides": [ ... ],
  "fechamento": {"rotulo": "...", "titulo": "...", "texto": "..."},
  "ilustrativo": false
}
```

- **Lista:** `{"rotulo", "titulo", "itens": ["**destaque** complemento", ...]}`
- **Pergunta e Resposta:** `{"rotulo", "pergunta", "resposta"}`
- **Mito × Fato:** `{"rotulo", "mito", "fato"}`

Marcação: `*texto*` = ênfase em itálico; `**texto**` = destaque na cor da marca.

## Contrato de um roteiro de Reels (`pecas.conteudo` com `modelo = 'reels'`)

```json
{
  "capa": {"kicker": "...", "titulo": "... *ênfase* ..."},
  "blocos": [{"etapa": "gancho|problema|estrategia|fechamento", "quem": "João|Giovanna",
              "fala": "...", "topicos": ["..."], "segundos": 5, "texto_tela": "...", "imagem": "..."}],
  "urgencia": "atemporal|postar_logo",
  "ilustrativo": false
}
```

Colunas próprias em `pecas`: `formato` (joao, giovanna, dupla), `duracao` (30, 45, 60), `lote` (AAAA-MM), `radar_id`, `fonte_url`, `data_postagem`, `gravado_em`.

## Regras

- A chave publicável do Supabase fica no `index.html` de propósito: ela foi feita para o navegador. Quem protege os dados são as regras RLS do banco.
- **Nenhum segredo vai para este repositório.** Isso inclui a chave da API da Anthropic, a `service_role` e o `CRON_SECRET`. Esses valores ficam só nos Secrets do Supabase.
- Cadastro público fica desligado. Usuários são criados manualmente no painel do Supabase.
