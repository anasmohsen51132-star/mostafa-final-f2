// src/app/(developer)/developer/errors/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "errors")!;

export default function ErrorsPage() {
  return <ComingSoonModule module={module_} />;
}
