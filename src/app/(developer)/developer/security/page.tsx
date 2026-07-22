// src/app/(developer)/developer/security/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "security")!;

export default function SecurityPage() {
  return <ComingSoonModule module={module_} />;
}
