import { headers } from "next/headers";

import { AppShell } from "@/components/app-shell";
import type { Lang } from "@/lib/i18n";
import { requireUser } from "@/lib/session";

type DockPosition = "side" | "top";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  const dockPosition: DockPosition = user.dockPosition === "top" ? "top" : "side";
  const path = headers().get("x-makyn-path") ?? "";

  return (
    <AppShell
      lang={lang}
      userName={user.fullName}
      activePath={path}
      dockPosition={dockPosition}
    >
      {children}
    </AppShell>
  );
}
