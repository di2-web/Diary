import React from 'react';
import { X, CheckCircle2, Clock, Sparkles, Map, ArrowRight, Layers, Volume2, ShieldCheck, Heart } from 'lucide-react';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StepItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  details: string[];
}

export const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps: StepItem[] = [
    {
      id: 'phase-1',
      title: 'Phase 1: 基礎基盤 ＆ マルチメディア・AI生成 (完了)',
      description: '日常の素材投入とGemini AIによる日記自動作成のコア基盤',
      status: 'completed',
      details: [
        '✅ テキスト・写真・マイク録音・音ファイル(mp3/m4a/wav)のマルチメディア投稿',
        '✅ Googleアカウント認証 (Firebase Auth)',
        '✅ Gemini 2.5 Flash による生言葉を活かした日記自動生成',
        '✅ 執筆スタイル切り替え（温かい、文学的、ポップ、日記風など）',
        '✅ カレンダー表示＆時系列タイムライン',
      ],
    },
    {
      id: 'phase-2',
      title: 'Phase 2: 気分の波 (Wave Canvas) ＆ 重み付け連携 (進捗中)',
      description: '24時間の気分の高低を描画し、AIがどの出来事を重視するか判定',
      status: 'in_progress',
      details: [
        '🎯 24時間軸の気分の波ドラッグ描画UI (Wave Canvas)',
        '🎯 気分の波データとAI生成プロンプトの連携（感情の山場をエピソード化）',
        '🎯 投稿の保護（ピン留め）＆自動クリーンアップ管理',
        '🎯 AIによるボイス・音声ファイルの文字起こし・雰囲気抽出',
      ],
    },
    {
      id: 'phase-3',
      title: 'Phase 3: 手帳デコレーション ＆ リッチ装飾 (予定)',
      description: 'AIが作った日記を自分で自由にデコる楽しさの提供',
      status: 'upcoming',
      details: [
        '🚀 手帳風デザインキャンバス（背景紙・和紙・マスキングテープ風UI）',
        '🚀 スタンプペタペタ機能（感情スタンプ、日付印、シール）',
        '🚀 手帳風フォント切り替え（手書き風、明朝体など）',
        '🚀 日記本文の直感的な手動リライト・修正エディタ',
      ],
    },
    {
      id: 'phase-4',
      title: 'Phase 4: 日常共有SNS ＆ カテゴリ交流 (計画中)',
      description: '親しい友人やサークル仲間と安心して共有し合うクローズドSNS',
      status: 'upcoming',
      details: [
        '💬 カテゴリ別共有設定（自分のみ / 親友 / サークル / クラス）',
        '💬 手帳のフチに残すコメント（BeReal風リアルタイム交流）',
        '💬 心地よい「いいね」＆手帳スタンプリアクション',
        '💬 行動ログ・マイページ分析（感情の波の傾向グラフ）',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-amber-50/95 rounded-2xl max-w-2xl w-full border border-amber-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-800 to-stone-900 text-white flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-100 flex items-center gap-2">
                WaveLog 開発ロードマップ
              </h2>
              <p className="text-xs text-stone-300">ひとつずつ着実に機能を整理・拡張しています</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-amber-100/60 rounded-xl p-4 border border-amber-200 text-xs text-stone-700 leading-relaxed space-y-1">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              WaveLog のコアバリュー
            </div>
            <p>
              「記録する時間を減らし、思い出に残る時間を増やす」── 日中にラフに素材を投げるだけで、AIがあなたの生の言葉を活かした温かい日記をまとめます。
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step) => {
              const isDone = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200/90'
                      : isInProgress
                      ? 'bg-amber-100/40 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                      : 'bg-white/80 border-stone-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isDone && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                      {isInProgress && <Clock className="w-5 h-5 text-amber-600 animate-spin-slow shrink-0" />}
                      {!isDone && !isInProgress && <Layers className="w-5 h-5 text-stone-400 shrink-0" />}
                      <h3 className="font-bold text-stone-800 text-sm">{step.title}</h3>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isInProgress
                          ? 'bg-amber-200 text-amber-900 border-amber-400 animate-pulse'
                          : 'bg-stone-100 text-stone-600 border-stone-300'
                      }`}
                    >
                      {isDone ? '完了' : isInProgress ? '開発・調整中' : '次回実装予定'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mb-3 pl-7">{step.description}</p>

                  <ul className="pl-7 space-y-1.5">
                    {step.details.map((d, i) => (
                      <li key={i} className="text-xs text-stone-700 flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-amber-200/60 flex items-center justify-between text-xs text-stone-600">
          <span>バージョン: 3.4.0</span>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-900 text-white font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
