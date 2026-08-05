import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { MomentPostForm } from './components/MomentPostForm';
import { MomentsList } from './components/MomentsList';
import { DiaryGeneratorModal } from './components/DiaryGeneratorModal';
import { DiaryCard } from './components/DiaryCard';
import { SnsTimeline } from './components/SnsTimeline';
import { CalendarView } from './components/CalendarView';
import { UserProfileModal } from './components/UserProfileModal';
import { RoadmapModal } from './components/RoadmapModal';
import { Moment, Diary, UserProfile } from './types';
import {
  auth,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  db,
  addDoc,
  deleteDoc,
} from './firebase';
import { Sparkles, Calendar as CalendarIcon, Wand2, Plus, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'sns' | 'moments' | 'calendar'>('sns');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);

  // Selected date (defaults to Today YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data for selectedDate
  const [todayMoments, setTodayMoments] = useState<Moment[]>([]);
  const [todayDiary, setTodayDiary] = useState<Diary | null>(null);

  // Listen to Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setCurrentUser(snap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            displayName: u.displayName || 'LifeLogユーザー',
            photoURL: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`,
            bio: 'つぶやきからAI日記をつくっています✨',
            diaryStyle: 'poetic',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userRef, newProfile);
          setCurrentUser(newProfile);
        }
      } else {
        // Auto-create persistent anonymous user for seamless instant demo experience
        setCurrentUser(null);
      }
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  // Listen to moments for selectedDate and currentUser
  useEffect(() => {
    if (!currentUser?.uid) {
      setTodayMoments([]);
      return;
    }

    const q = query(
      collection(db, 'moments'),
      where('userId', '==', currentUser.uid),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Moment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Moment);
      });
      list.sort(
        (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      );
      setTodayMoments(list);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, selectedDate]);

  // Listen to diary for selectedDate and currentUser
  useEffect(() => {
    if (!currentUser?.uid) {
      setTodayDiary(null);
      return;
    }

    const q = query(
      collection(db, 'diaries'),
      where('userId', '==', currentUser.uid),
      where('date', '==', selectedDate)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setTodayDiary({ id: docSnap.id, ...docSnap.data() } as Diary);
      } else {
        setTodayDiary(null);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, selectedDate]);

  // Seed sample moments for quick demo
  const handleLoadSampleMoments = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const samples = [
      {
        content: '朝からお気に入りの路地裏カフェへ。挽きたての珈琲の香ばしいかおりと静かなジャズに包まれて穏やかなスタート。',
        type: 'text' as const,
        mediaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
      },
      {
        content: '午後は散歩がてら大きな公園へ。木の葉の間から落ちる木漏れ日がすごく綺麗でリフレッシュできた！',
        type: 'image' as const,
        mediaUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop&q=80',
      },
      {
        content: '帰り道の夕焼け空がグラデーションで絵画みたいだった。今日も一日無事に過ごせて感謝。',
        type: 'text' as const,
        mediaUrl: '',
      },
    ];

    for (const s of samples) {
      await addDoc(collection(db, 'moments'), {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL || '',
        date: selectedDate,
        type: s.type,
        content: s.content,
        mediaUrl: s.mediaUrl,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleDeleteTodayDiary = async (diaryId: string) => {
    try {
      await deleteDoc(doc(db, 'diaries', diaryId));
      setTodayDiary(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans antialiased selection:bg-amber-200 selection:text-stone-900 pb-16">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenRoadmap={() => setIsRoadmapModalOpen(true)}
        onGenerateDiaryClick={() => {
          if (!currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          if (todayMoments.length === 0) {
            setActiveTab('moments');
            return;
          }
          setIsGeneratorModalOpen(true);
        }}
        hasMomentsToday={todayMoments.length > 0}
      />

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Tab 1: SNS Timeline */}
        {activeTab === 'sns' && (
          <SnsTimeline
            currentUser={currentUser}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onNavigateToMoments={() => setActiveTab('moments')}
          />
        )}

        {/* Tab 2: My Moments & Today's AI Diary */}
        {activeTab === 'moments' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Date Selector Header */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                <span className="font-serif font-bold text-stone-800 text-base">
                  対象日付:
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-stone-300 px-3 py-1 text-xs text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-stone-50 font-medium"
                />
              </div>

              {todayMoments.length === 0 && (
                <button
                  onClick={handleLoadSampleMoments}
                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  サンプル投稿を追加してお試し
                </button>
              )}
            </div>

            {/* If Diary is already generated for selectedDate */}
            {todayDiary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <h2 className="font-serif font-bold text-xl text-stone-800">
                      {selectedDate} のAI日記（生成済み）
                    </h2>
                  </div>

                  <button
                    onClick={() => setIsGeneratorModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                    再生成する
                  </button>
                </div>

                <DiaryCard
                  diary={todayDiary}
                  currentUser={currentUser}
                  onRequireAuth={() => setIsAuthModalOpen(true)}
                  onDeleteDiary={handleDeleteTodayDiary}
                  isSingleView={true}
                />
              </div>
            ) : null}

            {/* Moment Post Input Form */}
            <MomentPostForm
              user={currentUser}
              selectedDate={selectedDate}
              onMomentAdded={() => {
                // Keep view on moments
              }}
              onRequireAuth={() => setIsAuthModalOpen(true)}
            />

            {/* Stream of Posted Moments */}
            <MomentsList
              moments={todayMoments}
              selectedDate={selectedDate}
              currentUserId={currentUser?.uid || null}
              onMomentsUpdated={() => {}}
              onGenerateDiaryClick={() => {
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsGeneratorModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 3: Calendar Archive */}
        {activeTab === 'calendar' && (
          <CalendarView
            currentUser={currentUser}
            onSelectDate={(dateStr) => {
              setSelectedDate(dateStr);
              setActiveTab('moments');
            }}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserSet={(userProfile) => setCurrentUser(userProfile)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        onSignOut={() => setCurrentUser(null)}
      />

      {/* Diary Generator Modal */}
      <DiaryGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        moments={todayMoments}
        selectedDate={selectedDate}
        user={currentUser}
        onDiaryCreated={() => {
          setActiveTab('moments');
        }}
      />
      {/* Roadmap Modal */}
      <RoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
      />
    </div>
  );
}
