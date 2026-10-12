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

## Versões

| Versão | Etapa | Conteúdo |
|---|---|---|
| v001 | 0 | Infraestrutura, login e painel com a equipe de agentes (inativos) |

## Regras

- A chave publicável do Supabase fica no `index.html` de propósito: ela foi feita para o navegador. Quem protege os dados são as regras RLS do banco.
- **Nenhum segredo vai para este repositório.** Isso inclui a chave da API da Anthropic, a `service_role` e o `CRON_SECRET`. Esses valores ficam só nos Secrets do Supabase.
- Cadastro público fica desligado. Usuários são criados manualmente no painel do Supabase.
