import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  RefreshCw, 
  FileText, 
  MessageSquare, 
  LogOut, 
  ShieldAlert,
  Server,
  User as UserIcon
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload Inventory', path: '/upload', icon: UploadCloud },
    { name: 'Reconciliation Results', path: '/results', icon: RefreshCw },
    { name: 'Executive Reports', path: '/reports', icon: FileText },
    { name: 'AI Chat Assistant', path: '/chat', icon: MessageSquare },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between select-none">
        <div>
          {/* Logo / Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-2">
            <ShieldAlert className="h-6 w-6 text-violet-500 animate-pulse" />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              ReconAgent
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20 glow-brand'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="h-8 w-8 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/30">
              <UserIcon className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-slate-200">{user?.username || 'Admin'}</p>
              <p className="text-xs text-slate-500 truncate">System Integrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400 font-medium">CMDB Reconciliation Tool</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>API Gateway Connected</span>
            </div>
          </div>
        </header>

        {/* Body content */}
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
