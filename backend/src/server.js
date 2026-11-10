import { buildApp } from './app.js';
import { config } from './config.js';

async function main() {
  const app = await buildApp({ logger: true });

  try {
    await app.listen({
      port: config.port,
      host: config.host
    });
    console.log(`Rommie backend listening on http://${config.host}:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
