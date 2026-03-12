import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  Settings, 
  Map,
  User,
  ChevronRight
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      navigate('/');
    } else {
      setIsLoading(false);
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f1115]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Telemetry Hub', icon: Activity, path: '/telemetry' },
    { name: 'Control Panel', icon: Settings, path: '/control-panel' },
    { name: 'Path Planning', icon: Map, path: '/path-planning' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1115] text-white font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-64 bg-[#181b21] border-r border-white/5 flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            S
          </div>
          <span className="text-lg font-bold tracking-tight">SmartAGV</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border border-transparent'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-400' : 'text-gray-400 group-hover:text-gray-300'} />
                <span className="font-medium">{item.name}</span>
                {isActive && <ChevronRight size={16} className="ml-auto text-indigo-400" />}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <Outlet />
      </div>
    </div>
  );
}
