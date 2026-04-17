import { OnboardingFlow } from "./onboarding-flow";
import { requireUser } from "@/lib/session";
import type { Lang } from "@/lib/i18n";

export default async function NewCompanyPage() {
  const user = await requireUser();
  const lang: Lang = user.preferredLanguage === "en" ? "en" : "ar";
  return <OnboardingFlow lang={lang} />;
}
