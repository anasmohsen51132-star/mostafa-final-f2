// src/app/(developer)/developer/monitoring/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "monitoring")!;

export default function MonitoringPage() {
  return <ComingSoonModule module={module_} />;
}
