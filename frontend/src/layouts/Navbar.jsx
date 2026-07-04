import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, LogOut, Menu, X, Briefcase, User, Compass, FileText, Settings, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) => `
    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'bg-primary/20 text-primary-glow border border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'}
  `;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-border/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-bold font-display tracking-tight text-white group-hover:text-primary-glow transition-colors duration-200">
                Project <span className="text-primary-glow">EARTH</span>
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">Beta</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/explore-projects" className={navLinkClass('/explore-projects')}>
              <Compass className="w-4 h-4" />
              <span>Explore Projects</span>
            </Link>
            <Link to="/explore-creators" className={navLinkClass('/explore-creators')}>
              <User className="w-4 h-4" />
              <span>Explore Creators</span>
            </Link>

            {user ? (
              <>
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                {user.role === 'Creator' && (
                  <>
                    <Link to="/applications" className={navLinkClass('/applications')}>
                      <FileText className="w-4 h-4" />
                      <span>Applications</span>
                    </Link>
                    <Link to={`/creator/${user.id}`} className={navLinkClass(`/creator/${user.id}`)}>
                      <Briefcase className="w-4 h-4" />
                      <span>My Portfolio</span>
                    </Link>
                  </>
                )}
                <Link to="/settings" className={navLinkClass('/settings')}>
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Link>
                <div className="w-px h-6 bg-border mx-2" />
                
                {/* User avatar/profile details */}
                <div className="flex items-center gap-3 pl-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-white font-medium">{user.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{user.role}</span>
                  </div>
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage.startsWith('/') ? user.profileImage : user.profileImage} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full border border-primary/40 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 text-primary-glow flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition">
                  Sign In
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary hover:bg-primary-hover text-white rounded-lg shadow-lg hover:shadow-primary/30 transition-all duration-200">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-zinc-400 hover:text-white rounded-lg"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2">
          <Link to="/explore-projects" className="block px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
            Explore Projects
          </Link>
          <Link to="/explore-creators" className="block px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
            Explore Creators
          </Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="block px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
              {user.role === 'Creator' && (
                <>
                  <Link to="/applications" className="block px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
                    Applications
                  </Link>
                  <Link to={`/creator/${user.id}`} className="block px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
                    My Portfolio
                  </Link>
                </>
              )}
              <Link to="/settings" className="block px-3 py-2 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800" onClick={() => setIsOpen(false)}>
                Settings
              </Link>
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }} 
                className="w-full flex items-center gap-2 px-3 py-2 text-left rounded-md text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
              <Link to="/login" className="block text-center px-4 py-2 rounded-md border border-zinc-700 text-zinc-300" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
              <Link to="/register" className="block text-center px-4 py-2 rounded-md bg-primary text-white" onClick={() => setIsOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
