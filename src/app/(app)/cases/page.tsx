"use client";

import { useState } from "react";
import { Book, FileText, ListChecks } from "lucide-react";
import { DocumentIntakeClient } from "@/components/DocumentIntakeClient";
import { LibraryClient } from "@/components/LibraryClient";
import { QueuePanel } from "@/components/QueuePanel";
import { getPatriciaQueue } from "@/lib/patricia-queue";

export default function CasesPage() {
  const [activeTab, setActiveTab] = useState<"library" | "intake" | "queue">("library");
  
  // Need queue length to show badge on the tab if > 0
  const queueCount = getPatriciaQueue().length;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border bg-panel px-6 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-6">Cases Workspace</h1>
        <div className="flex gap-6 border-b-0 border-border">
          <button 
            onClick={() => setActiveTab("library")} 
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${activeTab === "library" ? "border-foreground text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"}`}
          >
            <Book size={16} /> Saved Cases
          </button>
          <button 
            onClick={() => setActiveTab("intake")} 
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${activeTab === "intake" ? "border-foreground text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"}`}
          >
            <FileText size={16} /> Add Case
          </button>
          <button 
            onClick={() => setActiveTab("queue")} 
            className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${activeTab === "queue" ? "border-foreground text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"}`}
          >
            <ListChecks size={16} /> Job Queue
            {queueCount > 0 && (
              <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-black text-accent-foreground">
                {queueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "library" && <LibraryClient />}
        {activeTab === "intake" && <DocumentIntakeClient />}
        {activeTab === "queue" && <QueuePanel />}
      </div>
    </div>
  );
}
