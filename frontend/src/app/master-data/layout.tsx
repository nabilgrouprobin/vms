import { MasterDataShell } from "@/components/master-data/master-data-shell";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return <MasterDataShell>{children}</MasterDataShell>;
}
