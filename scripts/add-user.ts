import { UserRole } from "@prisma/client";

import { prisma } from "../src/db/client";

type Args = {
  telegramId: string;
  name: string;
  role: UserRole;
};

function parseArgs(argv: string[]): Args {
  const args = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 2) {
    args.set(argv[index], argv[index + 1]);
  }

  const telegramId = args.get("--telegram-id");
  const name = args.get("--name");
  const role = args.get("--role") as UserRole | undefined;

  if (!telegramId || !name || !role || !Object.values(UserRole).includes(role)) {
    throw new Error('Usage: npm run add-user -- --telegram-id 12345 --name "Ahmed" --role TESTER');
  }

  return { telegramId, name, role };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const user = await prisma.user.upsert({
    where: {
      telegramId: BigInt(args.telegramId)
    },
    update: {
      displayName: args.name,
      role: args.role,
      isActive: args.role !== UserRole.BLOCKED
    },
    create: {
      telegramId: BigInt(args.telegramId),
      displayName: args.name,
      role: args.role,
      isActive: args.role !== UserRole.BLOCKED
    }
  });

  console.log(`User saved: ${user.displayName} (${user.telegramId.toString()}) as ${user.role}`);
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

