import React from 'react';
import { Sparkles, BookOpen, Calendar, Globe, User, LogIn, Map, Activity } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'sns' | 'moments' | 'wave' | 'calendar';
  setActiveTab: (tab: 'sns' | 'moments' | 'wave' | 'calendar') => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenRoadmap: () => void;
  onGenerateDiaryClick: () => void;
  hasMomentsToday: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenProfile,
  onOpenRoadmap,
  onGenerateDiaryClick,
  hasMomentsToday,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('sns')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-amber-100 shadow-2xs group-hover:bg-stone-900 transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-stone-900 tracking-tight block">
              WaveLog
            </span>
            <span className="text-[10px] text-stone-500 font-medium tracking-wide -mt-1 block">
              手帳AI日記 ＆ スキマログ
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-stone-200/60 p-1 rounded-full border border-stone-300/40">
          <button
            id="nav-tab-sns"
            onClick={() => setActiveTab('sns')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'sns'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-stone-600" />
            タイムライン
          </button>

          <button
            id="nav-tab-moments"
            onClick={() => setActiveTab('moments')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all relative ${
              activeTab === 'moments'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            きょうの記録
            {hasMomentsToday && (
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse absolute top-2 right-2" />
            )}
          </button>

          <button
            id="nav-tab-wave"
            onClick={() => setActiveTab('wave')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'wave'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            気分の波 (Wave)
          </button>

          <button
            id="nav-tab-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'calendar'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-stone-600" />
            カレンダー
          </button>
        </nav>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-roadmap-nav"
            onClick={onOpenRoadmap}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-stone-700 bg-amber-100/70 hover:bg-amber-200/80 border border-amber-300/80 transition-all cursor-pointer"
            title="開発ロードマップを確認"
          >
            <Map className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">ロードマップ</span>
          </button>

          <button
            id="btn-generate-diary-nav"
            onClick={onGenerateDiaryClick}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>日記を作成</span>
          </button>

          {user ? (
            <button
              id="btn-profile-menu"
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-200/60 transition-colors border border-stone-200"
              title="プロフィール・設定"
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt={user.displayName}
                className="w-8 h-8 rounded-lg object-cover bg-stone-100"
                referrerPolicy="no-referrer"
              />
            </button>
          ) : (
            <button
              id="btn-login-nav"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300/80 shadow-2xs transition-all"
            >
              <LogIn className="w-4 h-4 text-stone-500" />
              ログイン
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-t border-amber-200/50 bg-amber-50/95">
        <button
          onClick={() => setActiveTab('sns')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium border-b-2 ${
            activeTab === 'sns' ? 'border-amber-600 text-amber-700 bg-amber-100/40' : 'border-transparent text-stone-600'
          }`}
        >
          <Globe className="w-4 h-4" />
          みんなのDiary
        </button>
        <button
          onClick={() => setActiveTab('moments')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium border-b-2 relative ${
            activeTab === 'moments' ? 'border-rose-500 text-rose-700 bg-rose-50/40' : 'border-transparent text-stone-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          きょうの記録
          {hasMomentsToday && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-2 right-4" />}
        </button>
        <button
          onClick={() => setActiveTab('wave')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium border-b-2 ${
            activeTab === 'wave' ? 'border-amber-500 text-amber-700 bg-amber-100/40' : 'border-transparent text-stone-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          気分の波
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium border-b-2 ${
            activeTab === 'calendar' ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40' : 'border-transparent text-stone-600'
          }`}
        >
          <Calendar className="w-4 h-4" />
          カレンダー
        </button>
      </div>
    </header>
  );
};
