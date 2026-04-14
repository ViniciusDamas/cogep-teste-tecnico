# Pesquisa de domínio — Regularização Fundiária Urbana (REURB)

Este documento reúne a pesquisa que fundamentou as decisões técnicas do projeto. O objetivo foi entender o negócio da COGEP para modelar um CRUD que faça sentido no contexto real, e não apenas um CRUD genérico.

---

## 1. Sobre a COGEP

| Campo | Valor |
|---|---|
| Sede | Campo Largo / PR |
| Fundação | 2007 (17+ anos) |
| Porte | ~40 funcionários |
| Grupo | Essex Holding |
| Reconhecimento | Portfólio Yunus Social Business (fev/2026) |
| Site institucional | https://cogep.eng.br |
| Produto interno | https://office.cogep.eng.br |

Empresa social de Regularização Fundiária Urbana (REURB) — pioneira em REURB privada no Brasil. Entrega "propriedade legal" a famílias de classe C/D/E, financiando o trabalho técnico enquanto a família paga parcelado.

**Números públicos declarados**: ~4.000 famílias tituladas, ~13.000 lotes em processo, 70+ loteamentos ativos (PR/SP/SC/RS/NE), 2.000+ imóveis rurais em regularização, 350+ projetos de engenharia concluídos.

**Cliente-chave público**: COHAPAR/PR — contrato para REURB em 6 municípios (Arapoti, Campo do Tenente, Carambeí, Lapa, Porto Amazonas, Sengés).

---

## 2. Stack de produção observado

Inspeção do `office.cogep.eng.br` revela:

- **Frontend**: Bootstrap 5 + Ant Design + SPA moderna
- **Backend** (inferido pela vaga): TypeScript + Node.js + Express + Sequelize + PostgreSQL + JWT
- **GIS** (inferido): PostgreSQL + PostGIS; georreferenciamento rural implica uso do SIGEF/INCRA

O teste técnico solicita exatamente **Angular + NgZorro (Ant Design for Angular) + Bootstrap** no frontend e **Node.js + Express + TypeScript + Sequelize** no backend — o teste espelha o stack de produção, o que guiou a decisão de caprichar na aderência ao NgZorro em vez de tentar features fora do escopo.

### Módulos visíveis do produto interno

1. Cadastro georreferenciado e socioeconômico
2. Cobrança (integração bancária automatizada)
3. Gestão de Projetos
4. Administrativo
5. Orçamentos (com IA)
6. Relatórios Inteligentes
7. Contratos

---

## 3. Fluxo REURB — 7 fases legais (Art. 28, Lei 13.465/2017)

A Lei 13.465/2017 define 7 fases obrigatórias (rol taxativo):

| Fase | Nome legal | Sub-etapas operacionais |
|---|---|---|
| I | Requerimento dos legitimados | Requerimento e triagem documental |
| II | Processamento administrativo | Classificação REURB-S/E · Cadastro socioeconômico · Notificação de confrontantes |
| III | Elaboração do projeto de regularização | Topografia/georreferenciamento · Análise ambiental (CONAMA/APP) · Projeto urbanístico |
| IV | Saneamento do processo | Diagnóstico jurídico-fundiário |
| V | Decisão da autoridade competente | Ato formal de aprovação publicado |
| VI | Expedição da CRF pelo Município | Emissão da Certidão de Regularização Fundiária |
| VII | Registro no cartório de imóveis | Registro da CRF e do projeto |

O sistema modela as **11 sub-etapas operacionais** na tabela `reurb_stages` (configurável), seguindo o padrão usado por prefeituras e pelo [Manual Prático REURB/MA do TJMA](https://novogerenciador.tjma.jus.br/storage/portalweb/manual_protico_da_reurb_ma_final_27112019_1554.pdf): as fases legais são agregadoras; as sub-etapas são o que efetivamente se acompanha no workflow diário.

**Tempo médio total do processo real**: 12–24 meses.

---

## 4. Panorama competitivo

| Sistema | Foco | Força | Lacuna observada |
|---|---|---|---|
| REURB.online | Prefeituras | BPM configurável, consulta CPF | Sem geocoding, sem notificação push |
| CTMGEO | Prefeituras | GIS integrado, gera CRF automática | Sem portal cidadão |
| e-REURB Sistema | Prefeituras | Gestão interna | Sem portal público para famílias |
| SICARF (Pará) | Estado | 100% digital, reduziu 8 anos → 23 dias com IA | Não é SaaS municipal |
| Terras do Brasil (MDA/Google 2025) | Federal | IA conversacional + governança | Foco federal, não municipal |

---

## 5. Dores reais identificadas no mercado

### 5.1 Família beneficiada não sabe em que fase está seu processo

**Evidência direta**: Câmara de Colombo/PR (17/03/2026): *"600 famílias aguardam regularização... moradores já realizaram pagamentos, mas ainda não têm previsão para conclusão"*.

Nenhum dos concorrentes analisados oferece notificação proativa de mudança de etapa. Todos operam em modelo *pull* (a família consulta por CPF quando lembra). Esse gap motivou duas decisões do projeto:

- **Consulta pública por protocolo** (`/consulta/:protocolo`) — rota sem autenticação, stepper visual mostrando em qual fase está o processo
- **Notificação WhatsApp via Twilio** — disparada a cada mudança de etapa pelo Kanban

### 5.2 Coleta em campo ainda usa papel/planilha

Pesquisa acadêmica confirma que "municípios carecem de geoprocessamento e plataformas integradas". SIGEF ainda recebe dados por upload manual. Abordável com PWA offline-first, mas exige experiência específica com sync de escritas — fora do escopo deste teste.

### 5.3 Dashboard B2G inexistente

Edital Capão Bonito/SP (Conc. Eletrônica 08/2026) exige dashboard + integração Sinter. O `office.cogep.eng.br` tem módulo "Relatórios" mas sem dashboard auto-servido para gestores municipais. Implementado no projeto via Chart.js + NgZorro Statistic.

### 5.4 Integração cartório manual

ConJur (mar/2025): *"integração prefeitura-cartório é desafiadora"*. A Lei 14.382/2022 estabelece prazo de 10 dias para o cartório, mas o envio ainda é manual. Integração ONR prevista no roadmap (não implementada).

### 5.5 Sobreposição de polígonos de lotes

Validada manualmente em QGIS por técnico especializado (~2 dias por lote). Erro passa despercebido até a fase VIII (notificação de confrontantes), onde invalida o processo. Resolvível com PostGIS `ST_Intersects` — previsto como próxima iteração.

---

## 6. Decisões técnicas justificadas

### 6.1 Modelar "atividade" como etapa de processo REURB

Os requisitos do PDF pedem CRUD de Pessoas e Atividades. Modelar "atividade" como etapa REURB (com `stage_id` referenciando tabela configurável) mantém o contrato mínimo e adiciona valor real: demonstra arquitetura escalável, trilha de auditoria aplicável a cadastros de valor legal, e compreensão do domínio do cliente.

### 6.2 Kanban configurável desde o primeiro commit

Etapas em tabela (`reurb_stages`), não hard-coded. Permite que cada município customize seu fluxo sem alteração de código. É requisito implícito para qualquer SaaS B2G de REURB.

### 6.3 Audit log com hooks Sequelize

Hooks `beforeUpdate`, `afterCreate`, `afterDestroy` gravam diff completo em `audit_logs` com FK para o usuário autor. Zero dependência externa. Requisito legal em cadastros fundiários.

### 6.4 Geocoding com ViaCEP + Nominatim

Cadeia: ViaCEP (CEP → endereço) + Nominatim/OSM (endereço → lat/lon). Ambos gratuitos e open. Rate-limited (1 req/s no Nominatim) — mitigado com debounce no frontend. Empresa de geotecnologia sem representação visual no mapa seria contraditório.

### 6.5 Notificação WhatsApp via Twilio Sandbox

- Provider pattern: `MockProvider` (default) e `TwilioProvider` (quando credenciais estão presentes no env). Troca de provider = 1 linha.
- Polling do status pós-POST (até 4s) detecta falhas assíncronas do Twilio (código 63015).
- Fallback automático para formato BR legado (números cadastrados no WhatsApp antes da ANATEL 2012 persistem sem o `9` extra pós-DDD).
- Em produção, o ideal é cachear o formato canônico via Twilio Lookup API — documentado no roadmap.

### 6.6 Consulta pública sem autenticação

Rota `/consulta/:protocolo` + endpoint `GET /api/public/consulta/:protocol`. Stepper vertical mostra o estado completo do processo. Protocolo no formato `REURB-YYYY-NNNNNN` expõe apenas o que o cidadão precisa — nenhum UUID interno vaza.

### 6.7 Clean architecture no backend

- `domain/` — types puros, framework-agnostic
- `models/` — Sequelize + associações
- `services/` — regra de negócio + validação Zod
- `controllers/` — adaptadores HTTP
- `routes/` — configuração Express
- `middlewares/` — auth JWT, error handler
- `utils/` — jwt, errors, protocol, text normalization

Dependência sempre flui para o domínio (controllers → services → models). Zero magia de DI.

### 6.8 Normalização UTF-8 via Zod

Helper `safeText()` aplica NFC e rejeita caracteres de substituição (U+FFFD) em todos os inputs. Blinda contra encoding quebrado vindo de bash do Windows ou de paste incorreto.

---

## 7. Arquitetura implementada

```
┌─────────────────────────────────────────────────────────┐
│   Angular 17 + NgZorro + Bootstrap                      │
│                                                          │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│   │ CRUD Pessoas│  │ CRUD Atividades│ │ Autenticação│   │
│   └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│   ┌─────────────────────────────────────────────┐       │
│   │ Domínio REURB                                │       │
│   │  • Kanban 11 sub-etapas (CDK DragDrop)       │       │
│   │  • Consulta pública por protocolo            │       │
│   │  • Dashboard B2G (Chart.js + NgZorro)        │       │
│   │  • Mapa Leaflet das pessoas (ViaCEP geocode) │       │
│   └─────────────────────────────────────────────┘       │
└──────────────────┬──────────────────────────────────────┘
                   │ REST + JWT
┌──────────────────┴──────────────────────────────────────┐
│   Node + Express + TypeScript + Sequelize               │
│                                                          │
│   • Audit log (hooks Sequelize)                         │
│   • Notificação WhatsApp (Twilio, provider pattern)     │
│   • Rotas públicas vs autenticadas separadas            │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │  PostgreSQL 16     │
         └────────────────────┘
```

---

## 8. Limitações conhecidas e trade-offs

- **Twilio Sandbox** tem limites de volume e requer opt-in por destinatário (`join <código>`). Em produção: WhatsApp Business API via Twilio ou Meta diretamente.
- **Fallback de formato BR legado** é pragmático (retry) — o correto em produção é cachear o formato canônico via Twilio Lookup API.
- **Cobertura de testes é foundational**, cobrindo o que tem mais risco de regredir (auth, activity-service, protocol, JWT). Não é exhaustive — E2E fica no roadmap.
- **PostGIS não integrado** — sobreposição de polígonos prevista mas não implementada.
- **OCR de documentos e integração ONR** — mencionados no roadmap como próximas iterações.

---

## 9. Fontes consultadas

- [Site oficial COGEP](https://cogep.eng.br)
- [COGEP no Yunus Social Business — TV Inovação (fev/2026)](https://www.tvinovacao.com.br/2026/02/negocio-brasileiro-portfolio-muhammad-yunus.html)
- [Gazeta do Povo — COGEP acelera regularização fundiária](https://www.gazetadopovo.com.br/vozes/parana-sa/cogep-regularizacao-fundiaria-transforma-bairros/)
- [Câmara Colombo/PR — 600 famílias sem previsão (17/03/2026)](https://transparencia.camaracolombo.pr.gov.br/index.php/2026/03/19/em-pauta-no-plenario-regularizacao-fundiaria-e-servicos-publicos-marcam-sessao-de-terca-17/)
- [Smart City Expo Curitiba 2026 — COGEP](https://bandnewsfmcuritiba.com/regularizacao-fundiaria-e-destaque-no-smart-city-expo-curitiba-2026/)
- [Lei 13.465/2017 (Planalto)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13465.htm)
- [Decreto 9.310/2018 (Planalto)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/decreto/d9310.htm)
- [Manual Prático REURB/MA — TJMA](https://novogerenciador.tjma.jus.br/storage/portalweb/manual_protico_da_reurb_ma_final_27112019_1554.pdf)
- [ONR RI Digital](https://ridigital.org.br/)
- [Edital Capão Bonito 08/2026](https://licitacao.capaobonito.sp.gov.br/concorrencia-eletronica-n08-2026-implantacao-licenciamento-de-uso-e-suporte-tecnico-de-software-para-constituir-o-cadastro-tecnico-multifinalitario-smaf/)
- [SICARF ITERPA Pará — 8 anos → 23 dias com IA](https://www.guiadopc.com.br/noticias/55643/instituto-de-terras-do-para-e-youx-reduzem-prazo-de-emissao-de-titulos-de-oito-anos-para-23-dias-com-plataforma-digital.html)
- [Terras do Brasil (MDA/Google 2025)](https://www.gov.br/mda/pt-br/noticias/2025/10/terras-do-brasil-projeto-de-inteligencia-artificial-para-governanca-fundiaria-do-mda-e-contemplado-em-edital-do-google-brasil)
- [ConJur mar/2025 — cartórios e REURB](https://www.conjur.com.br/2025-mar-26/cartorios-e-a-regularizacao-fundiaria-urbana-protagonistas-da-reurb-ou-meros-instrumentos-de-registro/)
