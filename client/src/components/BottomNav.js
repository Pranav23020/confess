import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BottomNav = ({ active }) => {
  const { user } = useContext(AuthContext);
  const meLink = user ? "/profile" : "/login";

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40 bg-background-light/70 dark:bg-background-dark/70 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-[24px] shadow-premium pb-2 pt-2 px-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        <Link to="/" className={`flex flex-col items-center gap-1 group py-2 px-4 rounded-2xl transition-all duration-300 ${active === 'home' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[24px] transition-transform group-active:scale-90 ${active === 'home' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>home</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${active === 'home' ? 'text-primary' : 'text-slate-500'}`}>Home</span>
        </Link>

        <Link to="/explore" className={`flex flex-col items-center gap-1 group py-2 px-4 rounded-2xl transition-all duration-300 ${active === 'explore' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[24px] transition-transform group-active:scale-90 ${active === 'explore' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>explore</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${active === 'explore' ? 'text-primary' : 'text-slate-500'}`}>Explore</span>
        </Link>

        <Link to={meLink} className={`flex flex-col items-center gap-1 group py-2 px-4 rounded-2xl transition-all duration-300 ${active === 'me' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[24px] transition-transform group-active:scale-90 ${active === 'me' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>person</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${active === 'me' ? 'text-primary' : 'text-slate-500'}`}>{user ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
