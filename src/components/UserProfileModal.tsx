import React, { useState } from 'react';
import { X, User, LogOut, Check, Sparkles, BookOpen } from 'lucide-react';
import { UserProfile, DiaryStyle } from '../types';
import { doc, updateDoc, db, firebaseSignOut, auth } from '../firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserUpdated: (updatedUser: UserProfile) => void;
  onSignOut: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onSignOut,
}) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [diaryStyle, setDiaryStyle] = useState<DiaryStyle>(user?.diaryStyle || 'poetic');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim(),
        diaryStyle,
      };

      await updateDoc(userRef, updatedData);

      const newProfile: UserProfile = {
        ...user,
        ...updatedData,
      };

      onUserUpdated(newProfile);
      onClose();
    } catch (err) {
      console.error('Save profile error:', err);
      alert('プロフィールの更新に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      onSignOut();
      onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const styleOptions: { id: DiaryStyle; label: string }[] = [
    { id: 'poetic', label: 'ポエティック (詩的)' },
    { id: 'warm', label: '温かい語り口調' },
    { id: 'novelist', label: '短編小説風' },
    { id: 'funny', label: 'ユーモア' },
    { id: 'concise', label: 'シンプル・要約' },
    { id: 'empathic', label: '共感・リスナー' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-amber-50 rounded-2xl max-w-md w-full border border-amber-200/80 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <img
            src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
            alt={user.displayName}
            className="w-12 h-12 rounded-2xl object-cover bg-white border border-stone-200 shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-800">
              プロフィール・設定
            </h3>
            <p className="text-stone-500 text-xs">AI日記の執筆スタイルをカスタマイズできます</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              表示名 (ニックネーム):
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              自己紹介メッセージ:
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="一言メッセージ..."
              className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              デフォルトのAI執筆文体:
            </label>
            <select
              value={diaryStyle}
              onChange={(e) => setDiaryStyle(e.target.value as DiaryStyle)}
              className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {styleOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> ログアウト
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> 保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
