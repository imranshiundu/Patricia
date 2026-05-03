import { Header } from "@/components/Header";
import { PatriciaClientBoot } from "@/components/PatriciaClientBoot";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <PatriciaClientBoot />
      <Sidebar />
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden px-6 pb-4 pt-[92px]">
        <Header />
        <section className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-slate-100 bg-white/45 shadow-sm">
          {children}
        </section>
      </main>
    </div>
  );
}
