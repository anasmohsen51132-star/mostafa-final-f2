// src/app/(developer)/developer/database/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "database")!;

export default function DatabasePage() {
  return <ComingSoonModule module={module_} />;
}
