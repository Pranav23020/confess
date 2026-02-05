import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DesktopNav = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Confessions</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link 
              to="/" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isActive('/') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive('/') ? 'filled' : ''}`}>home</span>
              <span className="font-medium">Home</span>
            </Link>
            
            <Link 
              to="/explore" 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isActive('/explore') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive('/explore') ? 'filled' : ''}`}>explore</span>
              <span className="font-medium">Explore</span>
            </Link>
            
            <Link 
              to={user ? "/profile" : "/login"}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                isActive('/profile') || isActive('/login') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive('/profile') || isActive('/login') ? 'filled' : ''}`}>person</span>
              <span className="font-medium">{user ? 'Profile' : 'Login'}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DesktopNav;
