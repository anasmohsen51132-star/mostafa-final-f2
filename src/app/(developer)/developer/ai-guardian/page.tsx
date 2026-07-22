// src/app/(developer)/developer/ai-guardian/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "ai-guardian")!;

export default function AiGuardianPage() {
  return <ComingSoonModule module={module_} />;
}
