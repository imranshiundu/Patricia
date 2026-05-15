import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
         <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-xl mb-6">
            <Sparkles className="text-amber-300" size={32} />
         </div>
         <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">Welcome back</h2>
         <p className="mt-2 text-sm text-slate-500 font-medium">Please sign in to your Patricia account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-10 px-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 rounded-3xl sm:px-10">
          <form className="space-y-6" action="#">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email address</label>
              <div className="mt-2">
                <input id="email" name="email" type="email" autoComplete="email" required 
                       className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm font-medium transition-shadow items-center" 
                       placeholder="lawyer@firm.co.ke" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700">Password</label>
              <div className="mt-2">
                <input id="password" name="password" type="password" autoComplete="current-password" required 
                       className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm font-medium transition-shadow items-center" 
                       placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded focus:ring-2 border-2 cursor-pointer transition-colors" />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer">Remember me</label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">Forgot your password?</a>
              </div>
            </div>

            <div>
              {/* Note: This is a demo form, so the button links purely physically for the MVP navigation */}
              <Link href="/" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_2px_10px_rgba(59,130,246,0.3)] text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-[0.98]">
                Sign in
              </Link>
            </div>
            
            <div className="mt-6 flex items-center justify-center">
               <span className="text-sm text-slate-500 font-medium">Don&apos;t have an account? <Link href="/signup" className="text-blue-600 font-bold hover:underline transition-colors">Sign up</Link></span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
