"use client";

import { Sparkles, X, Check, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

// For this MVP, we use a simple state-based modal that listens to a custom event
// In a real app, this would use Context or a library like Zustand
export function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-upgrade-modal", handleOpen);
    return () => window.removeEventListener("open-upgrade-modal", handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[32px] w-full max-w-6xl p-2 relative shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Hero Side */}
          <div className="lg:w-[30%] bg-slate-50 border border-slate-100 rounded-[24px] p-8 text-slate-900 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-white backdrop-blur-md flex items-center justify-center mb-6 border border-slate-200 shadow-sm">
                 <Sparkles size={24} className="text-amber-500" />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight leading-tight">Elevate your<br/>legal research.</h2>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Unlock broadcast-quality audio narration, unlimited AI summaries, and the ability to upload and digest infinite case law documents.
              </p>
            </div>
            
            <div className="relative z-10 mt-12 bg-white/60 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Trusted By</div>
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    PL
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  +1k
                </div>
              </div>
            </div>
          </div>

          {/* Right Pricing Side */}
          <div className="lg:w-[70%] p-8 overflow-y-auto">
             <div className="flex items-center gap-2 mb-8">
               <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Select Plan</span>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {/* Student Plan */}
               <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 transition-colors cursor-pointer group flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Student</h3>
                  <div className="text-slate-500 text-sm mb-4 min-h-[40px]">Core features for learning.</div>
                  <div className="flex items-end gap-1 mb-6">
                     <span className="text-3xl font-bold text-slate-900">KES 500</span>
                     <span className="text-slate-400 text-sm pb-1">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    <Feature text="Unlimited Library Access" />
                    <Feature text="20 Case Audio Streams / mo" />
                    <Feature text="No audio downloads" crossed />
                    <Feature text="Basic Support" crossed />
                  </ul>
                  <button className="w-full bg-slate-100 text-slate-800 font-bold py-2.5 rounded-xl group-hover:bg-slate-200 transition-colors text-sm mt-auto">
                     Choose Student
                  </button>
               </div>

               {/* Professional Plan */}
               <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-6 relative cursor-pointer shadow-sm shadow-blue-500/5 hover:shadow-md transition-shadow flex flex-col">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap">
                    Most Popular
                  </div>
                  <h3 className="font-bold text-blue-900 text-lg mb-1">Professional</h3>
                  <div className="text-slate-600 text-sm mb-4 min-h-[40px]">For practicing advocates.</div>
                  <div className="flex items-end gap-1 mb-6">
                     <span className="text-3xl font-bold text-slate-900">KES 2,300</span>
                     <span className="text-slate-500 text-sm pb-1">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    <Feature text="Unlimited Audio Streaming" />
                    <Feature text="Unlimited AI Summaries" />
                    <Feature text="Download MP3 for offline" />
                    <Feature text="Upload Custom PDFs" />
                  </ul>
                  <button className="w-full bg-blue-500 text-white font-bold py-2.5 rounded-xl hover:bg-blue-600 transition-colors text-sm shadow-[0_2px_10px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 mt-auto">
                     Upgrade Now <ArrowRight size={14} />
                  </button>
               </div>

               {/* Enterprise Plan */}
               <div className="border border-slate-200 rounded-2xl p-6 hover:border-blue-200 transition-colors cursor-pointer group flex flex-col">
                  <h3 className="font-bold text-slate-800 text-lg mb-1">Enterprise</h3>
                  <div className="text-slate-500 text-sm mb-4 min-h-[40px]">For law firms and teams.</div>
                  <div className="flex items-end gap-1 mb-6">
                     <span className="text-3xl font-bold text-slate-900">KES 9,900</span>
                     <span className="text-slate-400 text-sm pb-1">/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    <Feature text="Everything in Professional" />
                    <Feature text="5 Team Member Accounts" />
                    <Feature text="Custom Firm Branding" />
                    <Feature text="Priority 24/7 Support" />
                  </ul>
                  <button className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm mt-auto">
                     Contact Sales
                  </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, crossed }: { text: string; crossed?: boolean }) {
  return (
    <li className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${crossed ? 'bg-slate-100' : 'bg-blue-100'}`}>
         {crossed ? <X size={10} className="text-slate-400" /> : <Check size={10} className="text-blue-600" />}
      </div>
      <span className={crossed ? 'text-slate-400 line-through decoration-slate-300' : ''}>{text}</span>
    </li>
  );
}
