import { LayoutDashboard, Users, Database, Settings2, LogOut, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Admin Sidebar */}
      <aside className="w-[280px] bg-slate-900 text-white flex flex-col p-6 flex-shrink-0 relative overflow-y-auto">
         <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
               P
            </div>
            <span className="font-bold text-lg tracking-tight">Admin Portal</span>
         </div>
         
         <div className="space-y-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
            <NavItem icon={<Database size={18} />} label="Manage Cases" count={12} />
            <NavItem icon={<Users size={18} />} label="Subscribers" count={1240} />
            <NavItem icon={<Settings2 size={18} />} label="System Settings" />
         </div>
         
         <div className="mt-auto pt-8 border-t border-slate-800">
            <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-slate-400 font-medium hover:bg-slate-800 hover:text-white transition-colors">
               <LogOut size={18} /> Exit to App
            </Link>
         </div>
      </aside>

      {/* Admin Main Area */}
      <main className="flex-1 overflow-y-auto p-10 px-12 relative">
         <div className="flex items-center justify-between mb-10">
            <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
               <p className="text-slate-500 mt-2 font-medium">Performance and ingestion metrics for Patricia AI.</p>
            </div>
            <button className="bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-[0_2px_10px_rgba(59,130,246,0.3)] hover:bg-blue-600 active:scale-95 transition-all">
               Run AI Ingestion Job
            </button>
         </div>

         {/* Stats Grid */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
             <StatCard label="Total Cases Ingested" value="14,239" change="+12%" />
             <StatCard label="Active Professional Subs" value="842" change="+5%" />
             <StatCard label="Audio Hours Generated" value="3,109" change="+21%" />
         </div>

         {/* Pending Approvals Table */}
         <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                 <h2 className="font-bold text-lg text-slate-900">Pending Summaries (Awaiting Approval)</h2>
                 <Link href="#" className="text-blue-500 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">View All Directory</Link>
             </div>
             <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">Case ID</th>
                       <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">Citation</th>
                       <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">AI Confidence</th>
                       <th className="py-4 px-6 font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    <TableRow id="CAS-901" citation="R v. Ndolo (2020)" confidence={98} />
                    <TableRow id="CAS-092" citation="Ochieng v. KNEC (2021)" confidence={94} />
                    <TableRow id="CAS-112" citation="Mutua v. Republic (1995)" confidence={82} />
                    <TableRow id="CAS-765" citation="Gacheru v. RBA (2018)" confidence={99} />
                 </tbody>
             </table>
         </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, count, active }: any) {
    return (
        <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors font-medium ${active ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <span className="flex items-center gap-3">
                {icon} {label}
            </span>
            {count && (
                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>
            )}
        </button>
    )
}

function StatCard({ label, value, change }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow transition-shadow">
            <h3 className="text-slate-500 font-bold text-sm mb-4 uppercase tracking-wider">{label}</h3>
            <div className="flex items-end gap-3">
               <span className="text-4xl font-black tracking-tight text-slate-900 leading-none">{value}</span>
               <span className="flex items-center text-sm font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg mb-1">
                  <ArrowUpRight size={14} className="mr-1" /> {change}
               </span>
            </div>
        </div>
    )
}

function TableRow({ id, citation, confidence }: any) {
    return (
        <tr className="hover:bg-slate-50 transition-colors group">
            <td className="py-4 px-6 text-sm font-bold font-mono text-slate-500">{id}</td>
            <td className="py-4 px-6 text-sm font-bold text-slate-800">{citation}</td>
            <td className="py-4 px-6">
               <div className="flex items-center gap-3 max-w-[120px]">
                   <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${confidence}%` }}></div>
                   </div>
                   <span className="text-xs font-bold text-slate-500 font-mono">{confidence}%</span>
               </div>
            </td>
            <td className="py-4 px-6 text-right">
                <button className="text-blue-500 font-bold text-sm hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors active:scale-95">Review</button>
            </td>
        </tr>
    )
}
