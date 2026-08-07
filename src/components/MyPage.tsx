import React, { useState } from 'react';
import { UserProfile, DiaryStyle } from '../types';
import { doc, updateDoc, db, firebaseSignOut, auth } from '../firebase';
import { User, LogOut, Check, Users, Plus, Trash2, Settings, Sparkles, Shield, Bookmark, Heart, ChevronDown } from 'lucide-react';
import { CustomSelect } from './CustomSelect';
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
        <div className="w-16 h-16 bg-[#f3eff8] rounded-3xl flex items-center justify-center mx-auto text-[#9880be]">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#3d3546]">マイページ</h2>
        <p className="text-[#6e637c] text-sm">
          マイページを利用するにはログインまたはゲストログインが必要です。
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-[#9880be] hover:bg-[#8871b0] text-white font-bold px-6 py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer text-sm"
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
      <div className="bg-white rounded-3xl p-6 border border-[#e8e2f0] shadow-2xs flex flex-col sm:flex-row items-center gap-5">
        <img
          src={user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
          alt={user.displayName}
          className="w-20 h-20 rounded-2xl object-cover bg-[#f3eff8] border-2 border-[#ded5e8] shadow-2xs shrink-0"
          referrerPolicy="no-referrer"
        />
        <div className="text-center sm:text-left space-y-1 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="font-bold text-2xl text-[#3d3546]">{user.displayName}</h2>
            <span className="text-[10px] bg-[#f3eff8] text-[#8572a7] font-bold px-2.5 py-0.5 rounded-full border border-[#ded5e8]">
              WaveLog 会員
            </span>
          </div>
          <p className="text-xs text-[#6e637c] max-w-md">
            {user.bio || 'まだ自己紹介はありません'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#e8e2f0] shadow-2xs space-y-4">
          <h3 className="font-bold text-base text-[#3d3546] flex items-center gap-2 pb-2 border-b border-[#f0ebf7]">
            <User className="w-4 h-4 text-[#9880be]" /> 基本プロフィール
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-[#3d3546] block mb-1.5">
                表示名 (ニックネーム):
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-2xl border border-[#ded5e8] px-3 py-2.5 text-xs text-[#3d3546] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 bg-[#f8f5f0]/50 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#3d3546] block mb-1.5">
                デフォルトAI執筆文体:
              </label>
              <CustomSelect
                value={diaryStyle}
                options={styleOptions}
                onChange={(val) => setDiaryStyle(val as DiaryStyle)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#3d3546] block mb-1.5">
              自己紹介メッセージ:
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              placeholder="一言メッセージ..."
              className="w-full rounded-2xl border border-[#ded5e8] p-3 text-xs text-[#3d3546] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 bg-[#f8f5f0]/50 resize-none font-medium"
            />
          </div>
        </div>

        {/* Share Categories Management */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#e8e2f0] shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#f0ebf7]">
            <div>
              <h3 className="font-bold text-base text-[#3d3546] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9880be]" /> 共有カテゴリ (共有グループ) 設定
              </h3>
              <p className="text-[11px] text-[#6e637c] mt-0.5">
                投稿や手帳日記をだれに公開・共有するかを複数カテゴリで分けて選べます。
              </p>
            </div>
            <span className="text-[11px] text-[#8572a7] bg-[#f3eff8] border border-[#ded5e8] font-bold px-2.5 py-1 rounded-full self-start sm:self-auto shrink-0">
              最大 5 カテゴリ
            </span>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-[#3d3546] block">デフォルトカテゴリ (固定):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f3eff8] border border-[#ded5e8]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">👥</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#3d3546] block truncate">Default</span>
                    <span className="text-[10px] text-[#6e637c] block truncate">デフォルト共有枠</span>
                  </div>
                </div>
                <span className="text-[10px] bg-white text-[#8572a7] border border-[#ded5e8] font-bold px-2 py-0.5 rounded-md shrink-0 ml-2">基本</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f0ebf7] border border-[#ded5e8]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">🌐</span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#3d3546] block truncate">All</span>
                    <span className="text-[10px] text-[#6e637c] block truncate">すべての友達に公開</span>
                  </div>
                </div>
                <span className="text-[10px] bg-white text-[#8572a7] border border-[#ded5e8] font-bold px-2 py-0.5 rounded-md shrink-0 ml-2">全友達</span>
              </div>
            </div>

            {/* Custom Categories List */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#3d3546]">
                  カスタム共有カテゴリ (あと {3 - customCategories.length} つ追加可能):
                </span>
              </div>

              {customCategories.length === 0 ? (
                <p className="text-xs text-[#8e859b] bg-[#f8f5f0]/50 p-3 rounded-2xl text-center border border-dashed border-[#ded5e8]">
                  まだカスタムカテゴリはありません（例: 「家族」「親友」「趣味仲間」など）
                </p>
              ) : (
                <div className="space-y-2">
                  {customCategories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-[#f8f5f0]/50 border border-[#ded5e8] text-xs text-[#3d3546]"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-[#9880be] font-bold">#</span>
                        <span>{cat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(idx)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-xl transition-colors cursor-pointer"
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
                    className="flex-1 min-w-0 rounded-2xl border border-[#ded5e8] px-3 py-2 text-xs text-[#3d3546] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 bg-[#f8f5f0]/50 font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="flex items-center justify-center gap-1 bg-[#9880be] hover:bg-[#8871b0] text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> 追加
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 px-4 py-2.5 rounded-2xl hover:bg-rose-50 transition-colors cursor-pointer border border-rose-200"
          >
            <LogOut className="w-4 h-4" /> ログアウト
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {saveSuccessMsg && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-2xl border border-emerald-200 animate-fade-in text-center">
                {saveSuccessMsg}
              </span>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 bg-[#9880be] hover:bg-[#8871b0] text-white font-bold text-xs px-6 py-2.5 rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> 設定を保存する
            </button>
          </div>
        </div>
      </form>

      {/* Friend Manager & Category Association Section */}
      <FriendManager currentUser={user} />
    </div>
  );
};
