import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col relative px-8 py-4 pt-[76px] overflow-y-auto pb-40">
        <Header />
        {children}
      </main>
      <UpgradeModal />
    </div>
  );
}
