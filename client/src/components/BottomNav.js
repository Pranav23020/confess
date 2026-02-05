import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BottomNav = ({ active }) => {
  const { user } = useContext(AuthContext);
  const meLink = user ? "/profile" : "/login";

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-40 bg-background-light/90 dark:bg-[#0f0c18]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 pb-5 pt-3">
      <div className="max-w-md mx-auto px-6 flex justify-between items-center">
        <Link to="/" className={`flex flex-col items-center gap-1 group w-16`}>
          <div className={`w-10 h-8 rounded-2xl flex items-center justify-center transition-colors ${active === 'home' ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[24px] ${active === 'home' ? 'text-primary filled' : 'text-slate-400 group-hover:text-white'}`}>home</span>
          </div>
          <span className={`text-[10px] font-semibold ${active === 'home' ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>Home</span>
        </Link>

        <Link to="/explore" className={`flex flex-col items-center gap-1 group w-16`}>
          <div className={`w-10 h-8 rounded-2xl flex items-center justify-center transition-colors ${active === 'explore' ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <span className={`material-symbols-outlined text-[24px] ${active === 'explore' ? 'text-primary filled' : 'text-slate-400 group-hover:text-white'}`}>explore</span>
          </div>
          <span className={`text-[10px] font-medium ${active === 'explore' ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>Explore</span>
        </Link>

        <Link to={meLink} className={`flex flex-col items-center gap-1 group w-16`}>
          <div className={`w-10 h-8 rounded-2xl flex items-center justify-center transition-colors ${active === 'me' ? 'bg-primary/10' : 'group-hover:bg-white/5'}`}>
            <div className="relative">
              <span className={`material-symbols-outlined text-[24px] ${active === 'me' ? 'text-primary filled' : 'text-slate-400 group-hover:text-white'}`}>person</span>
            </div>
          </div>
          <span className={`text-[10px] font-medium ${active === 'me' ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>{user ? 'Me' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
