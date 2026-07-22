// src/app/(developer)/developer/settings/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "settings")!;

export default function SettingsPage() {
  return <ComingSoonModule module={module_} />;
}
