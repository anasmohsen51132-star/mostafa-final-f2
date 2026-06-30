// src/app/(auth)/layout.tsx
import { ToastContainer } from "@/components/ui/Toast";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastContainer />
      {children}
    </>
  );
}
