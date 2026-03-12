import { ExternalLink, Settings2 } from 'lucide-react';

export default function ControlPanel() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#0f1115] text-white p-8 font-sans">
      <div className="max-w-md w-full bg-[#181b21] rounded-2xl p-8 border border-white/5 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-500/10 rounded-2xl">
            <Settings2 className="w-12 h-12 text-indigo-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">AGV Native Control</h1>
          <p className="text-gray-400">Click below to open the ESP32's native control portal. Note: This will navigate away from the current application.</p>
        </div>

        <a 
          href="http://192.168.4.1/" 
          className="inline-flex items-center justify-center space-x-3 w-full py-4 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
        >
          <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          <span>Launch Remote Portal</span>
        </a>
        
        <p className="text-xs text-gray-500 font-mono">Target: http://192.168.4.1/</p>
      </div>
    </div>
  );
}
