"use client";

import { Settings, User, Bell, Palette, CreditCard, ToggleRight, ToggleLeft } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  // Mock State for interactivity
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [theme, setTheme] = useState("light");

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 pb-12 pt-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Settings className="text-blue-500" size={32} />
          Settings
        </h1>
        <p className="text-slate-500 mt-2">Manage your account preferences, billing, and system configurations.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 p-4 gap-8 px-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
           <TabButton active={activeTab === "profile"} onClick={() => setActiveTab("profile")} icon={<User size={16} />} label="Account Profile" />
           <TabButton active={activeTab === "billing"} onClick={() => setActiveTab("billing")} icon={<CreditCard size={16} />} label="Billing & Plan" />
           <TabButton active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} icon={<Bell size={16} />} label="Notifications" />
           <TabButton active={activeTab === "appearance"} onClick={() => setActiveTab("appearance")} icon={<Palette size={16} />} label="Appearance" />
        </div>
        
        <div className="p-8">
           {/* Tab: Profile */}
           {activeTab === "profile" && (
             <div className="animate-in fade-in duration-300">
               <h3 className="font-bold text-lg text-slate-900 mb-6">Personal Information</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl text-sm font-medium">
                   <div>
                      <label className="block text-slate-500 mb-2">First Name</label>
                      <input type="text" defaultValue="Imran" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
                   </div>
                   <div>
                      <label className="block text-slate-500 mb-2">Last Name</label>
                      <input type="text" defaultValue="C." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900" />
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-slate-500 mb-2">Email Address</label>
                      <input type="email" defaultValue="imran@patricia.io" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-500 cursor-not-allowed" readOnly title="Email cannot be changed." />
                   </div>
               </div>
               <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                   <button className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors active:scale-95 shadow-md">
                      Save Changes
                   </button>
               </div>
             </div>
           )}

           {/* Tab: Billing */}
           {activeTab === "billing" && (
             <div className="animate-in fade-in duration-300">
               <h3 className="font-bold text-lg text-slate-900 mb-6">Current Plan</h3>
               <div className="border border-blue-200 bg-blue-50/50 rounded-2xl p-6 flex items-center justify-between mb-8 shadow-sm">
                   <div>
                       <div className="text-blue-700 font-bold text-xl mb-1 flex items-center gap-2">
                         Professional Plan <span className="bg-blue-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Active</span>
                       </div>
                       <div className="text-sm font-medium text-slate-500">KES 2,300 billed monthly. Next billing date: April 10, 2026.</div>
                   </div>
                   <button className="bg-white border border-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors shadow-sm active:scale-95">
                      Manage Subscription
                   </button>
               </div>
               
               <h3 className="font-bold text-lg text-slate-900 mb-4">Payment Methods</h3>
               <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between max-w-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-[10px] font-bold italic">VISA</div>
                   <div>
                     <p className="font-bold text-sm text-slate-800">Visa ending in 4242</p>
                     <p className="text-xs text-slate-500">Expires 12/28</p>
                   </div>
                 </div>
                 <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Edit</button>
               </div>
             </div>
           )}

           {/* Tab: Notifications */}
           {activeTab === "notifications" && (
             <div className="animate-in fade-in duration-300">
                <h3 className="font-bold text-lg text-slate-900 mb-6">Notification Preferences</h3>
                <div className="max-w-xl space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Email Alerts</h4>
                      <p className="text-xs text-slate-500 mt-1">Receive daily digests of your generated case summaries.</p>
                    </div>
                    <button onClick={() => setEmailAlerts(!emailAlerts)}>
                      {emailAlerts ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Browser Notifications</h4>
                      <p className="text-xs text-slate-500 mt-1">Get notified immediately when a long audio file finishes rendering.</p>
                    </div>
                    <button onClick={() => setBrowserAlerts(!browserAlerts)}>
                      {browserAlerts ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Marketing & Updates</h4>
                      <p className="text-xs text-slate-500 mt-1">Receive news about new features and legal tech updates.</p>
                    </div>
                    <button onClick={() => setMarketing(!marketing)}>
                      {marketing ? <ToggleRight size={32} className="text-blue-500" /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                  </div>

                </div>
             </div>
           )}

           {/* Tab: Appearance */}
           {activeTab === "appearance" && (
             <div className="animate-in fade-in duration-300">
                <h3 className="font-bold text-lg text-slate-900 mb-6">Interface Theme</h3>
                <p className="text-sm text-slate-500 mb-6">Select how Patricia looks on this device.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div 
                    onClick={() => setTheme("light")}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${theme === "light" ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg mb-3 flex items-center justify-center">
                       <div className="w-16 h-2 bg-slate-200 rounded-full mb-2"></div>
                       <div className="w-24 h-2 bg-slate-200 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 text-center">Light Mode</h4>
                  </div>

                  <div 
                    onClick={() => setTheme("dark")}
                    className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${theme === "dark" ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="w-full h-24 bg-slate-800 border-slate-700 rounded-lg mb-3 flex flex-col items-center justify-center">
                       <div className="w-16 h-2 bg-slate-600 rounded-full mb-2"></div>
                       <div className="w-24 h-2 bg-slate-600 rounded-full"></div>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 text-center">Dark Mode</h4>
                    <span className="block text-[10px] text-center text-slate-400 mt-1">(Under Construction)</span>
                  </div>
                </div>

             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 font-bold pb-2 -mb-[18px] transition-all active:scale-95 ${active ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-500 hover:text-slate-800"}`}
    >
      {icon} {label}
    </button>
  );
}
