import { Header } from "@/components/Header";
import { PatriciaClientBoot } from "@/components/PatriciaClientBoot";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground selection:bg-accent selection:text-accent-foreground">
      <PatriciaClientBoot />
      
      {/* New Arrangement: Thin, sleek vertical rail + Top Header + Main Content */}
      <Sidebar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto px-4 pb-4 pt-4 sm:px-8 sm:pb-8">
          <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col rounded-3xl border border-border bg-panel shadow-2xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
