import 'dotenv/config';
import { sequelize } from '../config/database';
import { ReurbStageModel } from '../models/reurbStage.model';

/**
 * 11 etapas REURB alinhadas ao Art. 28 da Lei 13.465/2017 (rol taxativo):
 *   I   — Requerimento dos legitimados
 *   II  — Processamento administrativo (classificação, cadastro, notificação)
 *   III — Elaboração do projeto de regularização (topografia, ambiental, urbanístico)
 *   IV  — Saneamento do processo administrativo (diagnóstico jurídico-fundiário)
 *   V   — Decisão da autoridade competente (ato formal publicado)
 *   VI  — Expedição da CRF pelo Município
 *   VII — Registro da CRF e do projeto no cartório de imóveis
 *
 * As fases II e III foram granularizadas em sub-etapas operacionais porque é
 * como prefeituras tratam o workflow real (vide Manual Prático REURB/MA).
 */
const STAGES = [
  { order: 1, code: 'REQUERIMENTO', name: 'Requerimento e triagem documental', slaDays: 14 },
  { order: 2, code: 'CLASSIFICACAO', name: 'Classificação REURB-S / REURB-E', slaDays: 30 },
  { order: 3, code: 'CADASTRO_SOCIAL', name: 'Cadastro socioeconômico dos ocupantes', slaDays: 45 },
  { order: 4, code: 'NOTIFICACAO', name: 'Notificação de confrontantes', slaDays: 30 },
  {
    order: 5,
    code: 'TOPOGRAFIA',
    name: 'Levantamento topográfico e georreferenciamento',
    slaDays: 40,
  },
  { order: 6, code: 'AMBIENTAL', name: 'Análise ambiental (CONAMA, APP)', slaDays: 45 },
  { order: 7, code: 'PROJETO', name: 'Projeto urbanístico de regularização', slaDays: 45 },
  { order: 8, code: 'JURIDICO', name: 'Saneamento (diagnóstico jurídico-fundiário)', slaDays: 60 },
  {
    order: 9,
    code: 'DECISAO',
    name: 'Decisão da autoridade e ato formal de aprovação',
    slaDays: 15,
  },
  {
    order: 10,
    code: 'CRF',
    name: 'Expedição da CRF (Certidão de Regularização Fundiária)',
    slaDays: 14,
  },
  { order: 11, code: 'REGISTRO', name: 'Registro da CRF em cartório de imóveis', slaDays: 30 },
];

export async function seedReurbStages() {
  // A coluna "order" tem unique constraint, então renomear/reordenar em uma
  // única passada gera conflito. Estratégia: pass 1 move tudo para orders
  // negativos (temporários), pass 2 aplica os valores finais.

  // Pass 1: upsert com order negativo temporário (únicos por construção).
  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i];
    const tempOrder = -(i + 1);
    const [row, created] = await ReurbStageModel.findOrCreate({
      where: { code: s.code },
      defaults: { ...s, order: tempOrder },
    });
    if (!created) {
      await row.update({ order: tempOrder });
    }
  }

  // Pass 2: aplica order final (positivo) + name + slaDays.
  for (const s of STAGES) {
    const row = await ReurbStageModel.findOne({ where: { code: s.code } });
    if (row) await row.update({ order: s.order, name: s.name, slaDays: s.slaDays });
  }
}

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync();
      await seedReurbStages();
      console.log(`Seed OK — ${STAGES.length} stages inserted/updated.`);
      process.exit(0);
    } catch (err) {
      console.error('Seed failed', err);
      process.exit(1);
    }
  })();
}
