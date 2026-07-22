// src/app/(developer)/developer/deployments/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "deployments")!;

export default function DeploymentsPage() {
  return <ComingSoonModule module={module_} />;
}
