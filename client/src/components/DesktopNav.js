import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DesktopNav = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background-light/70 dark:bg-background-dark/70 backdrop-blur-2xl border-b border-white/10 dark:border-white/5 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group transition-transform duration-300 hover:scale-[1.02]">
            <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-logo group-hover:shadow-glow transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="material-symbols-outlined text-white text-2xl relative z-10">auto_awesome</span>
            </div>
            <div className="flex flex-col -gap-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">anonconfess</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold opacity-80">Safe Space</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-3 p-1.5 bg-black/5 dark:bg-white/5 rounded-2xl backdrop-blur-md border border-white/5">
            <Link
              to="/"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${isActive('/')
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive('/') ? 'filled' : ''}`}>home</span>
              <span className="font-semibold text-sm">Home</span>
            </Link>

            <Link
              to="/explore"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${isActive('/explore')
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive('/explore') ? 'filled' : ''}`}>explore</span>
              <span className="font-semibold text-sm">Explore</span>
            </Link>

            <Link
              to={user ? "/profile" : "/login"}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 ${isActive('/profile') || isActive('/login')
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive('/profile') || isActive('/login') ? 'filled' : ''}`}>person</span>
              <span className="font-semibold text-sm">{user ? 'Profile' : 'Login'}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;
