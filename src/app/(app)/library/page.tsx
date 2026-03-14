import { BookOpen, Search, ListFilter, Play, Clock, MoreVertical } from "lucide-react";
import Link from "next/link";
import { AudioPlayer } from "@/components/AudioPlayer";

export default function LibraryPage() {
  return (
    <div className="flex h-full w-full max-w-7xl mx-auto px-4 pb-12 pt-4 gap-8">
      {/* Left List Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-2">
              <BookOpen className="text-blue-500" size={32} />
              Case Law Library
            </h1>
            <p className="text-slate-500">Your generated audio notes and case law summaries.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
              <ListFilter size={16} className="text-slate-400" />
              Filters
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search your library..."
            className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl py-3 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* List Header */}
          <div className="flex items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
             <div className="flex-1">Title & Citation</div>
             <div className="w-32 hidden md:block">Court</div>
             <div className="w-32 hidden lg:block">Topic</div>
             <div className="w-24 flex items-center gap-1 justify-end"><Clock size={14} /> Duration</div>
             <div className="w-12"></div>
          </div>
          
          <div className="divide-y divide-slate-100">
            <LibraryItem 
                title="Independent Electoral and Boundaries Commission (IEBC) v Maina Kiai & 5 others"
                citation="[2017]"
                court="Supreme Court"
                type="Constitutional Law"
                duration="45:00"
                active
            />
            <LibraryItem 
                title="Okiya Omtatah vs Attorney General"
                citation="[2023]"
                court="High Court"
                type="Finance Act"
                duration="2h 10m"
            />
            <LibraryItem 
                title="Republic vs. Wafula Buke"
                citation="[1998]"
                court="Court of Appeal"
                type="Criminal Law"
                duration="28:00"
            />
            <LibraryItem 
                title="Building Bridges Initiative (BBI)"
                citation="[2022]"
                court="Supreme Court"
                type="Constitutional Law"
                duration="3h 50m"
            />
          </div>
        </div>
      </div>

      {/* Right Player Container */}
      <div className="w-[380px] hidden xl:block flex-shrink-0 pt-[90px]">
         <div className="sticky top-6">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Now Playing</h3>
            </div>
            {/* The Audio Player */}
            <AudioPlayer />

            <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-2">Transcript & Notes</h4>
              <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-4">
                The core issue in this judgment centers on the finality of election results as declared at the constituency level. The court affirmed that the returning officer at the constituency is the final authority for those results...
              </p>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                View full transcript →
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}

function LibraryItem({ title, citation, court, type, duration, active }: any) {
    return (
        <div className={`px-6 py-4 flex items-center hover:bg-slate-50 transition-colors group cursor-pointer ${active ? 'bg-blue-50/30' : ''}`}>
            {/* Play Button Overlay */}
            <div className="w-10 flex-shrink-0">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${active ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-500 group-hover:text-white'}`}>
                  <Play size={14} className="ml-0.5 fill-current" />
               </div>
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                <h3 className={`font-bold text-[14px] truncate transition-colors ${active ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
                  {title} <span className="text-slate-400 font-normal ml-2">{citation}</span>
                </h3>
            </div>
            
            <div className="w-32 hidden md:block text-xs font-medium text-slate-500 truncate pr-4">
               {court}
            </div>
            
            <div className="w-32 hidden lg:block pr-4">
               <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                 {type}
               </span>
            </div>

            <div className="w-24 text-right text-xs font-mono font-medium text-slate-500">
                {duration}
            </div>

            <div className="w-12 flex justify-end">
               <button className="text-slate-300 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical size={16} />
               </button>
            </div>
        </div>
    );
}
