import { LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLogout } from '../hooks/useAuth';
import { disconnectSocket } from '../lib/socket';

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 shadow-lg backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-white animate-pulse" fill="currentColor" />
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse-slow"></div>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Pulse
            </h1>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-white font-semibold">{user?.displayName}</p>
              <p className="text-white/80 text-sm">@{user?.username}</p>
            </div>
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt={user?.displayName}
              className="w-10 h-10 rounded-full ring-2 ring-white/50 hover:ring-white transition-all"
            />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm border border-white/20"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;