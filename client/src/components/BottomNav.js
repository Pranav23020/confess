import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const BottomNav = ({ active }) => {
  const { user } = useContext(AuthContext);
  const meLink = user ? "/profile" : "/login";

  return (
    <nav className="md:hidden fixed bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-40 bg-background-light/70 dark:bg-background-dark/70 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-full shadow-premium pb-2 pt-2 px-1 sm:px-2">
      <div className="max-w-md mx-auto flex justify-around items-center">
        <Link to="/" className={`flex flex-col items-center gap-0.5 group py-2 px-3 sm:px-4 rounded-2xl transition-all duration-300 min-h-[56px] min-w-[56px] flex justify-center items-center ${active === 'home' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[22px] sm:text-[24px] transition-transform group-active:scale-90 ${active === 'home' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>home</span>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${active === 'home' ? 'text-primary' : 'text-slate-500'}`}>Home</span>
        </Link>

        <Link to="/explore" className={`flex flex-col items-center gap-0.5 group py-2 px-3 sm:px-4 rounded-2xl transition-all duration-300 min-h-[56px] min-w-[56px] flex justify-center items-center ${active === 'explore' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[22px] sm:text-[24px] transition-transform group-active:scale-90 ${active === 'explore' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>explore</span>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${active === 'explore' ? 'text-primary' : 'text-slate-500'}`}>Explore</span>
        </Link>

        <Link to="/new" className={`flex flex-col items-center gap-0.5 group py-2 px-3 sm:px-4 rounded-2xl transition-all duration-300 min-h-[56px] min-w-[56px] flex justify-center items-center ${active === 'new' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[22px] sm:text-[24px] transition-transform group-active:scale-90 ${active === 'new' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>edit_square</span>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${active === 'new' ? 'text-primary' : 'text-slate-500'}`}>New</span>
        </Link>

        <Link to={meLink} className={`flex flex-col items-center gap-0.5 group py-2 px-3 sm:px-4 rounded-2xl transition-all duration-300 min-h-[56px] min-w-[56px] flex justify-center items-center ${active === 'me' ? 'bg-primary/10' : ''}`}>
          <span className={`material-symbols-outlined text-[22px] sm:text-[24px] transition-transform group-active:scale-90 ${active === 'me' ? 'text-primary filled' : 'text-slate-400 group-hover:text-slate-200'}`}>person</span>
          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${active === 'me' ? 'text-primary' : 'text-slate-500'}`}>{user ? 'Profile' : 'Login'}</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
