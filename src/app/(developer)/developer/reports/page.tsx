// src/app/(developer)/developer/reports/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "reports")!;

export default function ReportsPage() {
  return <ComingSoonModule module={module_} />;
}
