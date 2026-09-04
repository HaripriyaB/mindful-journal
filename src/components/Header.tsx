import React from 'react';
import { UserProfile } from '../types';
import { 
  BookOpen, 
  TrendingUp, 
  History, 
  Plus, 
  LogOut, 
  LogIn, 
  Sparkles,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile | null;
  activeTab: 'write' | 'history' | 'evolution';
  setActiveTab: (tab: 'write' | 'history' | 'evolution') => void;
  onNewEntry: () => void;
  onLoginClick: () => void;
  onLogoutClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onNewEntry,
  onLoginClick,
  onLogoutClick
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-[#242731]/95 backdrop-blur-md border-b border-[#373b47] text-slate-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-inner text-slate-950 font-serif font-bold text-xl">
            M
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-semibold text-lg sm:text-xl tracking-tight text-slate-100">
                Mindful Journal
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400 inline" />
              <span>{currentDate}</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Only when authenticated) */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 bg-[#1c1e26] p-1 rounded-2xl border border-[#373b47]">
            <button
              id="tab-write-btn"
              onClick={() => setActiveTab('write')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'write'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#282c37]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Write & Reflect</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#282c37]'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              id="tab-evolution-btn"
              onClick={() => setActiveTab('evolution')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'evolution'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-[#282c37]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Emotion Evolution</span>
            </button>
          </nav>
        )}

        {/* User Profile & Actions */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {user.isAnonymous && (
                <button
                  id="header-upgrade-google-btn"
                  onClick={onLoginClick}
                  className="flex items-center space-x-1.5 bg-[#1c1e26] hover:bg-[#2d313d] text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm"
                  title="Connect your Google Account to sync reflections"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Sign In with Google</span>
                  <span className="sm:hidden">Google</span>
                </button>
              )}

              <button
                id="header-new-entry-btn"
                onClick={onNewEntry}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Entry</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-[#373b47]">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-[#373b47] object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1c1e26] border border-[#373b47] flex items-center justify-center text-xs font-bold text-slate-200">
                      {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <div className="hidden lg:flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate leading-tight">
                      {user.displayName}
                    </span>
                    {user.isAnonymous ? (
                      <span className="text-[10px] text-amber-400 font-mono leading-none mt-0.5">Guest Mode</span>
                    ) : user.email ? (
                      <span className="text-[10px] text-slate-400 truncate max-w-[120px] leading-none mt-0.5">{user.email}</span>
                    ) : null}
                  </div>
                </div>

                <button
                  id="header-logout-btn"
                  onClick={onLogoutClick}
                  title="Sign Out"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#1c1e26] transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="header-login-btn"
              onClick={onLoginClick}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      {user && (
        <div className="md:hidden flex items-center justify-around bg-[#1c1e26] border-t border-[#373b47] px-2 py-1.5">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'write' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Write</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'history' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'evolution' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Evolution</span>
          </button>
        </div>
      )}
    </header>
  );
};
