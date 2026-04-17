import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __makynPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__makynPrisma__ ??
  new PrismaClient({
    log: ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") {
  global.__makynPrisma__ = prisma;
}

