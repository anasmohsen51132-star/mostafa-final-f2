// src/app/(developer)/developer/performance/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "performance")!;

export default function PerformancePage() {
  return <ComingSoonModule module={module_} />;
}
