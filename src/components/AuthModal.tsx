import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Heart, BookOpen, Users, Lock } from 'lucide-react';
import {
  signInWithPopup,
  googleProvider,
  auth,
  doc,
  setDoc,
  db,
  getDoc,
} from '../firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSet: (userProfile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onUserSet }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await signInWithPopup(auth, googleProvider);
      const u = res.user;

      const userRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userRef);

      let profileData: UserProfile;
      if (snap.exists()) {
        profileData = snap.data() as UserProfile;
      } else {
        profileData = {
          uid: u.uid,
          displayName: u.displayName || 'WaveLogユーザー',
          photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
          bio: 'AI手帳で毎日の記録を静かに楽しんでいます✨',
          diaryStyle: 'poetic',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, profileData);
      }

      onUserSet(profileData);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err?.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        setError(
          `【Firebase設定エラー】現在のドメイン (${hostname}) が Firebase Authentication の「承認済みドメイン」に登録されていません。\n` +
          `Firebase Console > Authentication > 設定 > 承認済みドメイン に「${hostname}」を追加してください。`
        );
      } else if (err?.code === 'auth/admin-restricted-operation') {
        setError('Firebase認証設定でこのログイン操作が制限されています。管理者設定をご確認ください。');
      } else {
        setError('Googleログインに失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3d3546]/50 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#e8e2f0] shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#9880be]/10 rounded-full blur-2xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl text-[#8e859b] hover:text-[#3d3546] hover:bg-[#f3eff8] transition-colors cursor-pointer"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#9880be] to-[#8871b0] flex items-center justify-center text-white shadow-md mb-3.5">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="font-bold text-2xl text-[#3d3546] tracking-tight">
            WaveLog へようこそ
          </h2>
          <p className="text-[#6e637c] text-xs mt-1.5 leading-relaxed">
            日々のつぶやきや気分の波からAIが素敵な手帳日記を紡ぎ、大切な人とだけ静かにつながれます
          </p>
        </div>

        {/* Highlight Feature Badges */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="bg-[#f8f5f0] p-2.5 rounded-2xl border border-[#ded5e8] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#9880be] shrink-0" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#3d3546] block leading-tight">プライバシー安心</span>
              <span className="text-[9px] text-[#6e637c] block">友達限定の共有カテゴリ</span>
            </div>
          </div>

          <div className="bg-[#f8f5f0] p-2.5 rounded-2xl border border-[#ded5e8] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9880be] shrink-0" />
            <div className="text-left">
              <span className="text-[11px] font-bold text-[#3d3546] block leading-tight">AI手帳自動生成</span>
              <span className="text-[9px] text-[#6e637c] block">思い出と写真を一括編集</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs shadow-2xs font-medium whitespace-pre-line leading-relaxed">
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            id="btn-google-login"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#f8f5f0] border border-[#ded5e8] text-[#3d3546] font-bold text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.23v3.15C3.25 21.37 7.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.23C.44 8.16 0 9.98 0 12s.44 3.84 1.23 5.42l4.05-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.63 1.23 6.58l4.05 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{loading ? 'ログイン処理中...' : 'Googleアカウントでログイン'}</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-[#f0ebf7] flex items-center justify-center gap-4 text-[11px] text-[#6e637c]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 安全な認証システム
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> 無料で利用可能
          </span>
        </div>
      </div>
    </div>
  );
};

