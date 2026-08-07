import React, { useState, useEffect } from 'react';
import { UserProfile, FriendRelation } from '../types';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  db,
  onSnapshot,
} from '../firebase';
import { UserPlus, Users, Search, Check, Trash2, Copy, CheckCircle2, UserCheck, ShieldCheck, QrCode, Share2, Link } from 'lucide-react';

interface FriendManagerProps {
  currentUser: UserProfile;
}

export const FriendManager: React.FC<FriendManagerProps> = ({ currentUser }) => {
  const [friends, setFriends] = useState<FriendRelation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Invite URL based on user profile
  const inviteUrl = `${window.location.origin}/?inviteUid=${currentUser.uid}&name=${encodeURIComponent(currentUser.displayName || 'ユーザー')}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`;

  // All available categories for this user
  const allCategories = [
    { id: 'Default', label: 'Default (基本)' },
    { id: 'All', label: 'All (すべての友達)' },
    ...(currentUser.customShareCategories || []).map((catName) => ({
      id: catName,
      label: catName,
    })),
  ];

  // Fetch my friends list
  useEffect(() => {
    const q = query(
      collection(db, 'friends'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: FriendRelation[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as FriendRelation);
        });
        setFriends(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching friends listener:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser.uid]);

  // Copy My ID
  const handleCopyUid = () => {
    navigator.clipboard.writeText(currentUser.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Copy Invite Link
  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2000);
  };

  // Search Users
  const handleSearchUsers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const term = searchQuery.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const results: UserProfile[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserProfile;
        const uid = docSnap.id;
        if (uid === currentUser.uid) return; // Skip self

        const nameMatch = data.displayName?.toLowerCase().includes(term.toLowerCase());
        const uidMatch = uid === term;

        if (nameMatch || uidMatch) {
          results.push({ ...data, uid });
        }
      });

      setSearchResults(results);
    } catch (err) {
      console.error('Search users error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Add Friend
  const handleAddFriend = async (targetUser: UserProfile) => {
    // Check if already friend
    if (friends.some((f) => f.friendUid === targetUser.uid)) {
      alert(`${targetUser.displayName} さんは既に友達リストに登録されています。`);
      return;
    }

    try {
      await addDoc(collection(db, 'friends'), {
        userId: currentUser.uid,
        friendUid: targetUser.uid,
        friendDisplayName: targetUser.displayName,
        friendPhotoURL: targetUser.photoURL || '',
        friendBio: targetUser.bio || '',
        assignedCategories: ['Default'], // デフォルトで「共有する人」カテゴリに登録
        createdAt: new Date().toISOString(),
      });

      setStatusMessage(`${targetUser.displayName} さんを友達に追加しました！`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Add friend error:', err);
      alert('友達の追加に失敗しました。');
    }
  };

  // Toggle friend's assigned category
  const handleToggleFriendCategory = async (friend: FriendRelation, categoryId: string) => {
    const currentCats = friend.assignedCategories || [];
    let updatedCats: string[];

    if (currentCats.includes(categoryId)) {
      if (currentCats.length === 1 && categoryId === 'Default') {
        // Prevent removing all categories easily or warn
      }
      updatedCats = currentCats.filter((c) => c !== categoryId);
    } else {
      updatedCats = [...currentCats, categoryId];
    }

    try {
      const friendRef = doc(db, 'friends', friend.id);
      await updateDoc(friendRef, {
        assignedCategories: updatedCats,
      });
    } catch (err) {
      console.error('Update friend category error:', err);
    }
  };

  // Add Demo Friend Helper
  const handleAddDemoFriend = async (name: string, cat: string) => {
    const demoUid = 'demo_' + Math.random().toString(36).substring(2, 9);
    try {
      await addDoc(collection(db, 'friends'), {
        userId: currentUser.uid,
        friendUid: demoUid,
        friendDisplayName: name,
        friendPhotoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${demoUid}`,
        friendBio: 'LifeLog メンバー',
        assignedCategories: [cat],
        createdAt: new Date().toISOString(),
      });
      setStatusMessage(`サンプル友達「${name}」を追加しました！`);
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Add demo friend error:', err);
    }
  };

  // Delete Friend

  const handleRemoveFriend = async (friend: FriendRelation) => {
    if (!confirm(`${friend.friendDisplayName} さんを友達リストから削除しますか？`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'friends', friend.id));
    } catch (err) {
      console.error('Delete friend error:', err);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 border border-[#e8e2f0] shadow-2xs space-y-5 sm:space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f0ebf7]">
        <div>
          <h3 className="font-bold text-base text-[#3d3546] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9880be]" /> 友達・メンバー連携＆カテゴリ設定
          </h3>
          <p className="text-[11px] text-[#6e637c] mt-0.5">
            友達を追加し、それぞれの友達を「共有する人(Default)」や「家族」「親友」などのカテゴリに対応付けられます。
          </p>
        </div>
        <span className="text-xs bg-[#f3eff8] text-[#8572a7] font-bold px-3 py-1 rounded-full border border-[#ded5e8] self-start sm:self-auto shrink-0">
          友達 {friends.length} 人
        </span>
      </div>

      {/* User My ID Copy card */}
      <div className="bg-[#f8f5f0]/60 rounded-2xl p-3.5 border border-[#ded5e8] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-[#3d3546]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">あなたのマイID (友達に伝えて検索してもらえます):</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <code className="bg-white px-2.5 py-1.5 rounded-xl border border-[#ded5e8] text-[11px] font-mono text-[#3d3546] select-all flex-1 sm:flex-none text-center">
            {currentUser.uid}
          </code>
          <button
            type="button"
            onClick={handleCopyUid}
            className="flex items-center justify-center gap-1 bg-white hover:bg-[#f3eff8] text-[#3d3546] px-3 py-1.5 rounded-xl border border-[#ded5e8] transition-colors font-semibold shrink-0 cursor-pointer shadow-2xs"
          >
            {copiedUid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">コピー完了</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#9880be]" />
                <span>コピー</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invite Link & QR Code Card */}
      <div className="bg-[#f3eff8]/60 rounded-2xl p-4 border border-[#ded5e8] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#9880be]" />
            <h4 className="text-xs font-bold text-[#3d3546]">友達招待リンク ＆ QRコード</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowQrCode(!showQrCode)}
            className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#8572a7] bg-white hover:bg-[#eae3f2] px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-[#ded5e8] shadow-2xs self-start sm:self-auto"
          >
            <QrCode className="w-3.5 h-3.5 text-[#9880be]" />
            <span>{showQrCode ? 'QRコードを隠す' : 'QRコードを表示'}</span>
          </button>
        </div>

        <p className="text-[11px] text-[#6e637c] leading-relaxed">
          このユニーク招待リンクまたはQRコードをSNSやメッセージで共有すると、相手がアクセスしてワンタップで友達登録できます。
        </p>

        {/* Invite Link Box */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-2xl border border-[#ded5e8]">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 px-1">
            <Link className="w-3.5 h-3.5 text-[#9880be] shrink-0" />
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="text-[11px] text-[#3d3546] bg-transparent w-full focus:outline-hidden font-mono truncate select-all"
            />
          </div>
          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="flex items-center justify-center gap-1 bg-[#9880be] hover:bg-[#8871b0] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            {copiedInviteLink ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>コピー完了!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>リンクをコピー</span>
              </>
            )}
          </button>
        </div>

        {/* QR Code Collapsible View */}
        {showQrCode && (
          <div className="pt-3 border-t border-[#ded5e8] flex flex-col items-center justify-center space-y-3 bg-white p-4 rounded-2xl border border-[#e8e2f0] shadow-2xs animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-[#3d3546] block">
                {currentUser.displayName} さんの招待QRコード
              </span>
              <span className="text-[10px] text-[#6e637c] block">
                スマートフォンやカメラアプリで読み込んでください
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-[#9880be] shadow-2xs relative">
              <img
                src={qrCodeImageUrl}
                alt={`${currentUser.displayName}の招待QRコード`}
                className="w-44 h-44 object-contain rounded-lg"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#9880be] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                LifeLog AI Diary
              </div>
            </div>

            <p className="text-[10px] text-[#8e859b] text-center">
              ※QRコード画像はそのまま保存したりスクリーンショットで友達に共有できます。
            </p>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-700 text-center animate-fade-in">
          {statusMessage}
        </div>
      )}

      {/* Search and Add Friend Section */}
      <div className="space-y-3 pt-1">
        <h4 className="text-xs font-bold text-[#3d3546] flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-[#9880be]" /> 友達を探して追加する
        </h4>

        <form onSubmit={handleSearchUsers} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8e859b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="表示名またはマイIDを入力して検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-[#ded5e8] text-xs text-[#3d3546] focus:outline-hidden focus:ring-2 focus:ring-[#9880be]/30 bg-[#f8f5f0]/50 font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="bg-[#9880be] hover:bg-[#8871b0] text-white font-bold text-xs px-5 py-2.5 rounded-2xl transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-2xs"
          >
            検索
          </button>
        </form>

        {/* Quick Demo Add Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-[#8e859b] font-medium shrink-0">クイックお試し追加:</span>
          <button
            type="button"
            onClick={() => handleAddDemoFriend('山田 太郎 (家族)', 'Default')}
            className="text-[11px] bg-[#f3eff8] hover:bg-[#eae3f2] text-[#8572a7] font-semibold px-2.5 py-1 rounded-xl border border-[#ded5e8] transition-colors cursor-pointer"
          >
            ＋ 山田さん追加
          </button>
          <button
            type="button"
            onClick={() => handleAddDemoFriend('佐藤 花子 (親友)', 'Default')}
            className="text-[11px] bg-[#f8f5f0] hover:bg-[#eae3f2] text-[#6e637c] font-semibold px-2.5 py-1 rounded-xl border border-[#ded5e8] transition-colors cursor-pointer"
          >
            ＋ 佐藤さん追加
          </button>
        </div>


        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-[#f3eff8]/60 rounded-2xl p-3 border border-[#ded5e8] space-y-2">
            <span className="text-[11px] font-bold text-[#3d3546] block">検索結果:</span>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((userRes) => {
                const isAlreadyFriend = friends.some((f) => f.friendUid === userRes.uid);
                return (
                  <div
                    key={userRes.uid}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#ded5e8] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={userRes.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${userRes.uid}`}
                        alt={userRes.displayName}
                        className="w-7 h-7 rounded-lg object-cover bg-[#f3eff8] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-[#3d3546] block truncate">{userRes.displayName}</span>
                        <span className="text-[10px] text-[#6e637c] truncate block">{userRes.bio || '自己紹介未設定'}</span>
                      </div>
                    </div>

                    {isAlreadyFriend ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 ml-2">
                        <UserCheck className="w-3.5 h-3.5" /> 友達登録済み
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddFriend(userRes)}
                        className="flex items-center gap-1 bg-[#9880be] hover:bg-[#8871b0] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer shrink-0 ml-2"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> 友達追加
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Friends & Category Assignment List */}
      <div className="pt-3 border-t border-[#f0ebf7] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h4 className="text-xs font-bold text-[#3d3546]">
            登録済みの友達 ＆ 対応カテゴリの設定
          </h4>
          <span className="text-[11px] text-[#6e637c]">
            チェックを入れたカテゴリの限定投稿を相手が見られるようになります
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-[#6e637c] text-center py-4">読み込み中...</p>
        ) : friends.length === 0 ? (
          <div className="bg-[#f8f5f0]/40 rounded-2xl p-6 text-center border border-dashed border-[#ded5e8] space-y-2">
            <Users className="w-8 h-8 text-[#9880be]/60 mx-auto" />
            <p className="text-xs text-[#3d3546] font-medium">友達がまだ登録されていません</p>
            <p className="text-[11px] text-[#8e859b] max-w-xs mx-auto">
              上の検索欄から他のユーザーを友達追加して、共有カテゴリ（「家族」「親友」など）に振り分けてみましょう。
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => {
              const assigned = friend.assignedCategories || [];
              return (
                <div
                  key={friend.id}
                  className="bg-[#f8f5f0]/50 rounded-2xl p-3.5 sm:p-4 border border-[#ded5e8] space-y-3 transition-all hover:bg-[#f8f5f0]/80"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={friend.friendPhotoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.friendUid}`}
                        alt={friend.friendDisplayName}
                        className="w-9 h-9 rounded-xl object-cover bg-[#f3eff8] border border-[#ded5e8] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-[#3d3546] text-xs block truncate">
                          {friend.friendDisplayName}
                        </span>
                        <span className="text-[10px] text-[#8e859b] block truncate">
                          ID: {friend.friendUid.slice(0, 10)}...
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend)}
                      className="p-1.5 text-[#8e859b] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0 ml-2"
                      title="友達から削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category Assign Checkboxes */}
                  <div className="pt-2 border-t border-[#ded5e8]/60 space-y-2">
                    <span className="text-[11px] font-bold text-[#3d3546] block">
                      {friend.friendDisplayName} さんの所属カテゴリ (選択中: {assigned.length}件):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map((cat) => {
                        const isChecked = assigned.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleToggleFriendCategory(friend, cat.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border cursor-pointer ${
                              isChecked
                                ? 'bg-[#f3eff8] text-[#8572a7] border-[#9880be] font-bold shadow-2xs'
                                : 'bg-white text-[#6e637c] border-[#ded5e8] hover:bg-[#f8f5f0]'
                            }`}
                          >
                            <span className="text-sm font-bold text-[#9880be]">{isChecked ? '✓' : '＋'}</span>
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
