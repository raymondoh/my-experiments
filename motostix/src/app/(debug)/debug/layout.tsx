import { ReactNode } from "react";

import { denyInProdForDebug } from "@/lib/guards/deny-in-prod";

type DebugLayoutProps = {
  children: ReactNode;
};

export default function DebugLayout({ children }: DebugLayoutProps) {
  denyInProdForDebug();

  return <>{children}</>;
}
