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
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 text-stone-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-inner text-stone-950 font-serif font-bold text-xl">
            M
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-semibold text-lg sm:text-xl tracking-tight text-stone-100">
                Mindful Journal
              </h1>
            </div>
            <p className="text-xs text-stone-400 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400 inline" />
              <span>{currentDate}</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Only when authenticated) */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700/60">
            <button
              id="tab-write-btn"
              onClick={() => setActiveTab('write')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'write'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Write & Reflect</span>
            </button>

            <button
              id="tab-history-btn"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            <button
              id="tab-evolution-btn"
              onClick={() => setActiveTab('evolution')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'evolution'
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
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
              <button
                id="header-new-entry-btn"
                onClick={onNewEntry}
                className="hidden sm:flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-3.5 py-1.5 rounded-lg font-medium text-sm transition shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>New Entry</span>
              </button>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2.5 pl-2 border-l border-stone-700/60">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border border-stone-600 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-xs font-semibold text-stone-200">
                      {user.displayName?.charAt(0).toUpperCase() || <UserIcon className="w-4 h-4" />}
                    </div>
                  )}
                  <span className="hidden lg:block text-xs font-medium text-stone-300 max-w-[120px] truncate">
                    {user.displayName}
                  </span>
                </div>

                <button
                  id="header-logout-btn"
                  onClick={onLogoutClick}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="header-login-btn"
              onClick={onLoginClick}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-4 py-1.5 rounded-lg text-sm transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      {user && (
        <div className="md:hidden flex items-center justify-around bg-stone-800/90 border-t border-stone-700/60 px-2 py-1.5">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'write' ? 'text-amber-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span>Write</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'history' ? 'text-amber-400 font-semibold' : 'text-stone-400'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>History</span>
          </button>
          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              activeTab === 'evolution' ? 'text-amber-400 font-semibold' : 'text-stone-400'
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
