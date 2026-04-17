import { createBot, createWebhookServer, registerWebhook } from "./bot/bot";
import { config } from "./config";
import { prisma } from "@makyn/db";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const bot = createBot();
  await registerWebhook(bot);

  const server = createWebhookServer(bot);

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, "makyn_server_started");
  });

  const shutdown = async () => {
    logger.info("shutting_down");
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (error) => {
  logger.error({ error }, "startup_failure");
  await prisma.$disconnect();
  process.exit(1);
});

