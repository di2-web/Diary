import React, { useState } from 'react';
import { UserProfile, DiaryStyle } from '../types';
import { doc, updateDoc, db, firebaseSignOut, auth } from '../firebase';
import { User, LogOut, Check, Users, Plus, Trash2, Settings, Sparkles, Shield, Bookmark, Heart } from 'lucide-react';
import { FriendManager } from './FriendManager';

interface MyPageProps {

  user: UserProfile | null;
  onUserUpdated: (updatedUser: UserProfile) => void;
  onSignOut: () => void;
  onOpenAuth: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({
  user,
  onUserUpdated,
  onSignOut,
  onOpenAuth,
}) => {
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif text-stone-800">マイページ</h2>
        <p className="text-stone-600 text-sm">
          マイページを利用するにはログインまたはゲストログインが必要です。
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer text-sm"
        >
          ログインする
        </button>
      </div>
    );
  }

  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [diaryStyle, setDiaryStyle] = useState<DiaryStyle>(user.diaryStyle || 'poetic');
  const [customCategories, setCustomCategories] = useState<string[]>(user.customShareCategories || []);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (customCategories.length >= 3) {
      alert('カスタム共有カテゴリは最大3つまで追加できます。');
      return;
    }
    if (customCategories.includes(trimmed) || trimmed === '共有する人' || trimmed === 'すべての人') {
      alert('同名のカテゴリが既に存在します。');
      return;
    }
    setCustomCategories([...customCategories, trimmed]);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (index: number) => {
    setCustomCategories(customCategories.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim(),
        diaryStyle,
        customShareCategories: customCategories,
      };

      await updateDoc(userRef, updatedData);

      const newProfile: UserProfile = {
        ...user,
        ...updatedData,
      };

      onUserUpdated(newProfile);
      setSaveSuccessMsg('設定を更新しました！');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-amber-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <img
          src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
          alt={user.displayName}
          className="w-20 h-20 rounded-2xl object-cover bg-amber-50 border-2 border-amber-300 shadow-xs shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="text-center sm:text-left space-y-1 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="font-serif font-bold text-2xl text-stone-800">{user.displayName}</h2>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
              WaveLog 会員
            </span>
          </div>
          <p className="text-xs text-stone-600 max-w-md">
            {user.bio || 'まだ自己紹介はありません'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-stone-800 flex items-center gap-2 pb-2 border-b border-stone-100">
            <User className="w-4 h-4 text-amber-600" /> 基本プロフィール
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                表示名 (ニックネーム):
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                デフォルトAI執筆文体:
              </label>
              <select
                value={diaryStyle}
                onChange={(e) => setDiaryStyle(e.target.value as DiaryStyle)}
                className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50"
              >
                {styleOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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
              className="w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50 resize-none"
            />
          </div>
        </div>

        {/* Share Categories Management */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> 共有カテゴリ (共有グループ) 設定
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                投稿や手帳日記をだれに公開・共有するかを複数カテゴリで分けて選べます。
              </p>
            </div>
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 font-bold px-2.5 py-1 rounded-full shrink-0">
              最大 5 カテゴリ
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-stone-700 block">デフォルトカテゴリ (固定):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm">👥</span>
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Default</span>
                    <span className="text-[10px] text-amber-700">デフォルトの共有枠（Default登録の友達に届きます）</span>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-md">基本</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/80 border border-blue-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌐</span>
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">All</span>
                    <span className="text-[10px] text-blue-700">友達追加済みのすべての友達に届きます（友達以外には非公開）</span>
                  </div>
                </div>
                <span className="text-[10px] bg-blue-200/80 text-blue-900 font-bold px-2 py-0.5 rounded-md">全友達</span>
              </div>
            </div>

            {/* Custom Categories List */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700">
                  カスタム共有カテゴリ (あと {3 - customCategories.length} つ追加可能):
                </span>
              </div>

              {customCategories.length === 0 ? (
                <p className="text-xs text-stone-400 bg-stone-50 p-3 rounded-xl text-center border border-dashed border-stone-200">
                  まだカスタムカテゴリはありません（例: 「家族」「親友」「趣味仲間」など）
                </p>
              ) : (
                <div className="space-y-2">
                  {customCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-amber-600 font-bold">#</span>
                        <span>{cat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(idx)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Category Input */}
              {customCategories.length < 3 && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="新しいカテゴリ名 (例: 家族, サークル)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-300 p-2 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> 追加
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Friend Manager & Category Association Section */}
        <FriendManager currentUser={user} />

        {/* Action buttons */}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 px-4 py-2.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200"
          >
            <LogOut className="w-4 h-4" /> ログアウト
          </button>

          <div className="flex items-center gap-3">
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
                {saveSuccessMsg}
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> 設定を保存する
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
