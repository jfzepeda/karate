import { createServer } from "./index";

async function main() {
  const server = await createServer();
  const { url } = await server.start();
  // eslint-disable-next-line no-console
  console.log(`[karate-server] listening on ${url}`);
  // eslint-disable-next-line no-console
  console.log(`[karate-server] data dir: ${server.config.dataDir}`);
  // eslint-disable-next-line no-console
  console.log(`[karate-server] admin panel: ${url}/admin-panel`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[karate-server] failed to start:", err);
  process.exit(1);
});
