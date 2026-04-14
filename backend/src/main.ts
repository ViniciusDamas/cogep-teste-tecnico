import 'dotenv/config';
import { createServer } from './server';
import { sequelize } from './config/database';
import { env } from './config/env';
import { seedReurbStages } from './seeds/reurb-stages.seed';

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('[db] connection established');

    await sequelize.sync({ alter: env.NODE_ENV !== 'production' });
    console.log('[db] schema synchronized');

    await seedReurbStages();
    console.log('[db] seeds applied');

    const app = createServer();
    app.listen(env.PORT, () => {
      console.log(`[http] listening on :${env.PORT}`);
    });
  } catch (err) {
    console.error('[boot] failed to start', err);
    process.exit(1);
  }
}

bootstrap();
