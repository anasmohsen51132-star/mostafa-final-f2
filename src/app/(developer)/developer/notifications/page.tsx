// src/app/(developer)/developer/notifications/page.tsx
import { ComingSoonModule } from "@/components/developer/ComingSoonModule";
import { DEVELOPER_MODULES } from "@/components/developer/developerModules";

const module_ = DEVELOPER_MODULES.find((m) => m.id === "notifications")!;

export default function NotificationsPage() {
  return <ComingSoonModule module={module_} />;
}
