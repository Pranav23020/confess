import React from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from './PrimaryButton';

const EmptyState = ({ 
  title, 
  description, 
  actionText = 'Share a Thought',
  actionLink = '/new',
  showAction = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-6 relative z-10 w-full min-h-[60vh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-40 mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] opacity-30"></div>
      </div>
      
      <div className="flex flex-col items-center gap-8 w-full max-w-sm z-10">
        <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl opacity-60"></div>
          <div className="w-full h-full bg-cover bg-center rounded-3xl shadow-lg ring-1 ring-white/10 overflow-hidden relative" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDuzqj1bRv4GBOSQu3HFLYwiTXA8GOhGxlSNK0QrtFJ_zv5IlpUU15y90PsJbaFP-Hkq9aA3Wg4kT-QqVfz31gylbs9x9mttEsJcYEW46VXzw6ozxLK7STIw4N4VaChP60MqdRG9dTatJ8_of7OqkigMvROB7qDfGKNtXU7dPqVArhyBBpHzmZVdlmi26E27VV6NhZ8Kcw9Sr1FWlBBzviMGICNVmJ7tWTT_ULsia3bgdGqObzQVZmDBEEo0_LFue-v6V4mYZmSzOCn")'}}>
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <p className="text-base font-medium text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed">
            {description}
          </p>
        </div>
        
        {showAction && (
          <Link to={actionLink} className="w-full mt-4">
            <PrimaryButton icon="edit_note" className="w-full">
              {actionText}
            </PrimaryButton>
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
