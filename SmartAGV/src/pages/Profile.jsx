import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  Bell, 
  Cloud, 
  LogOut, 
  ShieldCheck, 
  Mail,
  Activity
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();

  // Dynamic user logic (Mock data for now)
  const userData = {
    username: 'Prateek Uthayakumar',
    email: 'admin@smartagv.local',
    role: 'System Admin',
    memberSince: '2026'
  };

  const [preferences, setPreferences] = useState({
    autoReconnect: true,
    notifications: true,
    cloudSync: false
  });

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('isLoggedIn');
      navigate('/');
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const ToggleSwitch = ({ label, icon: Icon, value, onChange }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[#1f1f1f] border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${value ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
          <Icon size={20} />
        </div>
        <span className="font-medium text-gray-200">{label}</span>
      </div>
      <button 
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#161616] ${
          value ? 'bg-indigo-500' : 'bg-gray-600'
        }`}
      >
        <span 
          className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 ${
            value ? 'left-7' : 'left-1'
          }`} 
        />
      </button>
    </div>
  );

  return (
    <main className="flex-1 flex justify-center h-full w-full p-8 overflow-y-auto bg-[#0a0a0a]">
      <div className="w-full max-w-2xl space-y-8 mt-4">
          
          <div className="flex items-center space-x-3 text-white/50 mb-8">
            <User className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">User Profile</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-[#161616] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
            
            {/* Header Banner */}
            <div className="h-32 bg-gradient-to-r from-indigo-900/40 to-cyan-900/40 border-b border-white/5 relative">
               <div className="absolute -bottom-12 left-8 p-1 bg-[#161616] rounded-full">
                 <div className="w-24 h-24 rounded-full bg-[#1f1f1f] border-2 border-white/10 flex items-center justify-center shadow-xl">
                   <User className="w-12 h-12 text-gray-400" />
                 </div>
               </div>
            </div>

            <div className="pt-16 pb-8 px-8 border-b border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{userData.username}</h2>
                  <div className="flex items-center space-x-2 text-cyan-400 mb-4">
                    <ShieldCheck size={16} />
                    <span className="font-medium text-sm">{userData.role}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <Mail size={16} />
                    <span>{userData.email}</span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-medium text-gray-400">
                  Member since: {userData.memberSince}
                </div>
              </div>
            </div>

            {/* System Settings Section */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-400" />
                System Preferences
              </h3>
              
              <div className="space-y-4">
                <ToggleSwitch 
                  label="Auto-Reconnect to AGV" 
                  icon={Activity} 
                  value={preferences.autoReconnect} 
                  onChange={() => togglePreference('autoReconnect')} 
                />
                <ToggleSwitch 
                  label="Alert Notifications" 
                  icon={Bell} 
                  value={preferences.notifications} 
                  onChange={() => togglePreference('notifications')} 
                />
                <ToggleSwitch 
                  label="Cloud Telemetry Sync" 
                  icon={Cloud} 
                  value={preferences.cloudSync} 
                  onChange={() => togglePreference('cloudSync')} 
                />
              </div>
            </div>

            {/* Footer / Actions */}
            <div className="px-8 py-6 bg-black/20 border-t border-white/5 flex items-center justify-between">
              <div className="text-sm text-gray-500 font-mono">
                SmartAGV Web App v1.0.0
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all font-medium"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      </main>
  );
}
