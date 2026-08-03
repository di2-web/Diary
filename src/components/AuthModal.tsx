import React, { useState } from 'react';
import { X, Sparkles, User, ShieldCheck, Heart } from 'lucide-react';
import {
  signInWithPopup,
  googleProvider,
  firebaseSignInAnonymously,
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
          displayName: u.displayName || 'LifeLogユーザー',
          photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
          bio: 'AI日記で日々の記録を楽しんでいます✨',
          diaryStyle: 'poetic',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, profileData);
      }

      onUserSet(profileData);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError('Googleログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await firebaseSignInAnonymously(auth);
      const u = res.user;

      const randomNames = ['ひまり', 'そうた', 'あかり', 'れん', 'ゆい', 'かいと', 'さくら'];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)] + '（ゲスト）';

      const profileData: UserProfile = {
        uid: u.uid,
        displayName: randomName,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
        bio: 'お試しゲストユーザーです。つぶやきからAI日記をつくっています。',
        diaryStyle: 'warm',
        createdAt: new Date().toISOString(),
      };

      const userRef = doc(db, 'users', u.uid);
      await setDoc(userRef, profileData);

      onUserSet(profileData);
      onClose();
    } catch (err: any) {
      console.error('Guest Sign In Error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (
        code === 'auth/admin-restricted-operation' ||
        code === 'auth/operation-not-allowed' ||
        msg.includes('admin-restricted-operation')
      ) {
        setError(
          'ANONYMOUS_DISABLED: Firebase Consoleの Authentication > Sign-in method で「匿名」プロバイダが無効になっています。Googleログインをご利用いただくか、Firebase Consoleで「匿名」を有効にしてください。'
        );
      } else {
        setError('お試しログインに失敗しました。Googleアカウントでのログインをお試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-amber-50 rounded-2xl max-w-md w-full border border-amber-200/80 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 via-rose-500 to-amber-400 flex items-center justify-center text-white shadow-lg mb-3">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-stone-800">
            LifeLog AI へようこそ
          </h2>
          <p className="text-stone-600 text-xs mt-1">
            日々の写真や音声、つぶやきからあなただけのAI日記を自動生成
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-100/90 border border-amber-300 text-stone-800 text-xs shadow-xs">
            {error.startsWith('ANONYMOUS_DISABLED:') ? (
              <div className="space-y-2">
                <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs">
                  <span>⚠️ 匿名ログイン（ゲスト機能）が無効です</span>
                </div>
                <p className="text-stone-700 leading-relaxed text-[11px]">
                  Firebase Consoleの<span className="font-mono bg-amber-200/60 px-1 py-0.5 rounded text-amber-900">Authentication &gt; Sign-in method</span>で「匿名」認証が許可されていません。
                </p>
                <p className="text-stone-600 text-[11px]">
                  設定なしですぐに使うには、下の<b>「Googleアカウントでログイン」</b>をご利用ください。
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="mt-1 w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Googleアカウントで今すぐログイン
                </button>
              </div>
            ) : (
              <p className="text-rose-800">{error}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            id="btn-google-login"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-medium py-3 rounded-xl shadow-2xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            Googleアカウントでログイン
          </button>

          <button
            id="btn-guest-login"
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-rose-500 hover:brightness-105 text-white font-medium py-3 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50 text-sm"
          >
            <User className="w-4 h-4" />
            登録なしでお試し利用（ゲスト）
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-amber-200/60 flex items-center justify-center gap-4 text-[11px] text-stone-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Firebase認証
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> 無料で試せる
          </span>
        </div>
      </div>
    </div>
  );
};
