"use client";

import { Sparkles, ArrowLeft, Play, Bookmark, Share2, Download, DownloadCloud, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const [openSection, setOpenSection] = useState("ruling"); // default open

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 pb-12 pt-4 relative">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/library" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm">
          <ArrowLeft size={16} /> Back to Library
        </Link>
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
               <Share2 size={16} /> Share
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium">
               <Bookmark size={16} /> Save
            </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Constitutional Law</span>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">2017</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Supreme Court of Kenya</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
              Independent Electoral and Boundaries Commission (IEBC) v Maina Kiai & 5 others
          </h1>
          
          <p className="text-slate-500 font-medium font-mono text-sm mb-8">Citation: [2017] eKLR • Case Number: Civil Appeal No. 105 of 2017</p>

          <div className="flex flex-wrap items-center gap-4">
              <button className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-[0_2px_10px_rgba(59,130,246,0.3)] hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-2">
                  <Play size={18} className="fill-current" /> Listen to Summary
              </button>
              <button 
                  onClick={() => window.dispatchEvent(new Event('open-upgrade-modal'))}
                  className="bg-white text-slate-700 border border-slate-200 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
              >
                  <DownloadCloud size={18} className="text-slate-400" /> Download Audio
              </button>
          </div>
      </div>

      {/* AI Summary Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-6">
          <div className="bg-slate-900 text-white p-4 px-6 flex items-center gap-3">
              <Sparkles className="text-amber-300" size={20} />
              <span className="font-bold">Patricia AI Overview</span>
          </div>

          <div className="divide-y divide-slate-100">
             <AccordionItem 
                 title="Material Facts" 
                 isOpen={openSection === 'facts'} 
                 onClick={() => setOpenSection(openSection === 'facts' ? '' : 'facts')}
             >
                 The respondents challenged the IEBC's declaration that presidential election results announced at the constituency level by returning officers are provisional and subject to confirmation by the National Tallying Centre. They argued this violated the Constitution which intended for decentralized, transparent electoral processes.
             </AccordionItem>
             
             <AccordionItem 
                 title="Key Legal Issues" 
                 isOpen={openSection === 'issues'} 
                 onClick={() => setOpenSection(openSection === 'issues' ? '' : 'issues')}
             >
                 <ul className="list-disc pl-5 space-y-2">
                     <li>Whether the results of the presidential election announced by the Constituency Returning Officer are final.</li>
                     <li>Whether the IEBC Chairperson has the power to alter, vary, or verify results transmitted from the constituency level.</li>
                     <li>Interpretation of Article 86 of the Constitution of Kenya regarding the electoral system.</li>
                 </ul>
             </AccordionItem>

             <AccordionItem 
                 title="The Final Ruling (Ratio Decidendi)" 
                 isOpen={openSection === 'ruling'} 
                 onClick={() => setOpenSection(openSection === 'ruling' ? '' : 'ruling')}
             >
                 The Supreme Court upheld the Court of Appeal's decision. It ruled that the results declared at the constituency tallying centers are final and cannot be altered, varied, or verified by the National Tallying Centre or the IEBC Chairperson. The Chairperson's role is strictly limited to tallying the already verified results from the 290 constituencies and declaring the final outcome. Any errors can only be challenged in an election court (the Supreme Court).
             </AccordionItem>

             <AccordionItem 
                 title="Precedent Impact" 
                 isOpen={openSection === 'precedent'} 
                 onClick={() => setOpenSection(openSection === 'precedent' ? '' : 'precedent')}
             >
                 This case is a landmark ruling establishing the decentralization of the electoral process in Kenya. It entrenched the principle that "voting, counting, tallying, and declaration of results at the constituency level is final," drastically reducing the potential for centralized electoral fraud during final tallying.
             </AccordionItem>
          </div>
      </div>
      
      {/* Disclaimer */}
      <div className="text-center pb-20 mt-8">
          <p className="text-slate-400 text-xs max-w-2xl mx-auto">This summary was generated by Patricia AI (GPT-4o) for educational and research convenience. It is not a substitute for qualified legal advice and should not be cited as a primary source in court. Always verify with the original published judgment.</p>
      </div>
    </div>
  );
}

function AccordionItem({ title, isOpen, onClick, children }: any) {
    return (
        <div className="cursor-pointer">
            <div className="px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors" onClick={onClick}>
                <h3 className="font-bold text-slate-800">{title}</h3>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="px-6 pb-6 text-slate-600 leading-relaxed max-w-4xl text-[15px]">
                    {children}
                </div>
            )}
        </div>
    )
}
