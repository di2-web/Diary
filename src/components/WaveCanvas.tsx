import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Activity, Sun, Moon, Smile, Frown, Music, Image as ImageIcon, Mic, FileText, Check } from 'lucide-react';
import { Moment, WavePoint } from '../types';

interface WaveCanvasProps {
  date: string;
  moments: Moment[];
  onGenerateWithWave: (points: WavePoint[]) => void;
  savedPoints?: WavePoint[];
}

// Generate default smooth neutral line
const DEFAULT_HOURS = Array.from({ length: 25 }, (_, i) => i);
const createInitialPoints = (): WavePoint[] => {
  return DEFAULT_HOURS.map((h) => ({ hour: h, score: 0 }));
};

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  date,
  moments,
  onGenerateWithWave,
  savedPoints,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [points, setPoints] = useState<WavePoint[]>(() => savedPoints && savedPoints.length > 0 ? savedPoints : createInitialPoints());
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeMoment, setActiveMoment] = useState<Moment | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(700);
  const canvasHeight = 260;
  const paddingX = 40;
  const paddingY = 30;

  // Handle ResizeObserver for canvas width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width) {
          setCanvasWidth(Math.max(320, Math.floor(entry.contentRect.width)));
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Map hour to X canvas coordinate
  const hourToX = useCallback(
    (h: number) => {
      const graphW = canvasWidth - paddingX * 2;
      return paddingX + (h / 24) * graphW;
    },
    [canvasWidth]
  );

  // Map X canvas coordinate to hour
  const xToHour = useCallback(
    (x: number) => {
      const graphW = canvasWidth - paddingX * 2;
      const clampedX = Math.max(paddingX, Math.min(canvasWidth - paddingX, x));
      return ((clampedX - paddingX) / graphW) * 24;
    },
    [canvasWidth]
  );

  // Map score (-100 to 100) to Y canvas coordinate
  const scoreToY = useCallback(
    (score: number) => {
      const graphH = canvasHeight - paddingY * 2;
      const centerY = paddingY + graphH / 2;
      // top is +100 (y = paddingY), bottom is -100 (y = canvasHeight - paddingY)
      return centerY - (score / 100) * (graphH / 2);
    },
    [canvasHeight]
  );

  // Map Y canvas coordinate to score (-100 to 100)
  const yToScore = useCallback(
    (y: number) => {
      const graphH = canvasHeight - paddingY * 2;
      const centerY = paddingY + graphH / 2;
      const score = ((centerY - y) / (graphH / 2)) * 100;
      return Math.max(-100, Math.min(100, Math.round(score)));
    },
    [canvasHeight]
  );

  // Update points during user drag
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const hour = xToHour(x);
    const score = yToScore(y);

    setPoints((prev) => {
      const updated = [...prev];
      // Find closest hour point
      const closestIdx = updated.reduce(
        (bestIdx, pt, idx) =>
          Math.abs(pt.hour - hour) < Math.abs(updated[bestIdx].hour - hour) ? idx : bestIdx,
        0
      );
      updated[closestIdx] = { hour: updated[closestIdx].hour, score };

      // Smooth nearby points slightly for pleasant curve
      if (closestIdx > 0) {
        updated[closestIdx - 1].score = Math.round(updated[closestIdx - 1].score * 0.6 + score * 0.4);
      }
      if (closestIdx < updated.length - 1) {
        updated[closestIdx + 1].score = Math.round(updated[closestIdx + 1].score * 0.6 + score * 0.4);
      }

      return updated;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerMove(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore pointer capture release error if already released
      }
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      handlePointerMove(e.clientX, e.clientY);
    }
  };

  // Redraw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Draw Grid Lines & Background Zones
    const graphW = canvasWidth - paddingX * 2;
    const graphH = canvasHeight - paddingY * 2;
    const centerY = paddingY + graphH / 2;

    // Gradient background for positivity and negativity
    const bgGrad = ctx.createLinearGradient(0, paddingY, 0, canvasHeight - paddingY);
    bgGrad.addColorStop(0, 'rgba(251, 146, 60, 0.08)'); // Orange top
    bgGrad.addColorStop(0.5, 'rgba(250, 250, 249, 0.4)'); // Neutral center
    bgGrad.addColorStop(1, 'rgba(99, 102, 241, 0.08)'); // Indigo bottom
    ctx.fillStyle = bgGrad;
    ctx.fillRect(paddingX, paddingY, graphW, graphH);

    // Center line (neutral score = 0)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(168, 162, 158, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(paddingX, centerY);
    ctx.lineTo(canvasWidth - paddingX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Time Vertical Gridlines (Every 3 hours: 0, 3, 6, 9, 12, 15, 18, 21, 24)
    ctx.fillStyle = '#78716c';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    for (let h = 0; h <= 24; h += 3) {
      const x = hourToX(h);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(214, 211, 209, 0.5)';
      ctx.moveTo(x, paddingY);
      ctx.lineTo(x, canvasHeight - paddingY);
      ctx.stroke();

      // Hour Labels
      const label = h === 0 ? '00:00' : h === 12 ? '12:00' : h === 24 ? '24:00' : `${h}時`;
      ctx.fillText(label, x, canvasHeight - paddingY + 16);
    }

    // 2. Draw Wave Curve Line
    if (points.length > 0) {
      ctx.beginPath();
      const firstX = hourToX(points[0].hour);
      const firstY = scoreToY(points[0].score);
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        const x1 = hourToX(p1.hour);
        const y1 = scoreToY(p1.score);
        const x2 = hourToX(p2.hour);
        const y2 = scoreToY(p2.score);

        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        ctx.quadraticCurveTo(x1, y1, cx, cy);
      }
      const lastPt = points[points.length - 1];
      ctx.lineTo(hourToX(lastPt.hour), scoreToY(lastPt.score));

      // Gradient for Wave Line
      const strokeGrad = ctx.createLinearGradient(0, paddingY, 0, canvasHeight - paddingY);
      strokeGrad.addColorStop(0, '#f97316'); // Warm Orange
      strokeGrad.addColorStop(0.5, '#eab308'); // Yellow
      strokeGrad.addColorStop(1, '#6366f1'); // Indigo

      ctx.strokeStyle = strokeGrad;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(249, 115, 22, 0.25)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Area fill under curve
      ctx.lineTo(hourToX(24), centerY);
      ctx.lineTo(hourToX(0), centerY);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, paddingY, 0, canvasHeight - paddingY);
      fillGrad.addColorStop(0, 'rgba(249, 115, 22, 0.15)');
      fillGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.05)');
      fillGrad.addColorStop(1, 'rgba(99, 102, 241, 0.12)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Points handles
      points.forEach((pt) => {
        const px = hourToX(pt.hour);
        const py = scoreToY(pt.score);
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });
    }

    // 3. Draw Moment Pin Markers on the Wave Canvas
    moments.forEach((m) => {
      let mHour = 12; // default fallback
      if (m.createdAt) {
        const d = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
        if (!isNaN(d.getTime())) {
          mHour = d.getHours() + d.getMinutes() / 60;
        }
      }

      const mx = hourToX(mHour);
      // Find curve score at this hour
      const matchingPt = points.reduce((prev, curr) =>
        Math.abs(curr.hour - mHour) < Math.abs(prev.hour - mHour) ? curr : prev
      );
      const my = scoreToY(matchingPt ? matchingPt.score : 0);

      // Draw vertical stem line to pin
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.moveTo(mx, centerY);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Pin Node
      ctx.beginPath();
      ctx.arc(mx, my, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [points, moments, canvasWidth, canvasHeight, hourToX, scoreToY, paddingX, paddingY]);

  // Presets
  const applyPreset = (type: 'flat' | 'high_afternoon' | 'rollercoaster' | 'night_owl') => {
    let newPts = createInitialPoints();
    if (type === 'high_afternoon') {
      newPts = newPts.map((p) => {
        if (p.hour >= 11 && p.hour <= 16) {
          return { hour: p.hour, score: Math.round(60 + Math.sin(p.hour) * 30) };
        }
        if (p.hour < 8) return { hour: p.hour, score: -20 };
        return { hour: p.hour, score: 20 };
      });
    } else if (type === 'rollercoaster') {
      newPts = newPts.map((p) => ({
        hour: p.hour,
        score: Math.round(Math.sin(p.hour * 0.7) * 75),
      }));
    } else if (type === 'night_owl') {
      newPts = newPts.map((p) => {
        if (p.hour >= 18) return { hour: p.hour, score: Math.round(40 + (p.hour - 18) * 8) };
        if (p.hour <= 6) return { hour: p.hour, score: -40 };
        return { hour: p.hour, score: -10 };
      });
    }
    setPoints(newPts);
  };

  // Icon for Moment Type
  const getMomentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-amber-600" />;
      case 'audio':
        return <Mic className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className="bg-amber-50/70 rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-800 flex items-center gap-2">
              気分の波 (Wave Canvas)
            </h3>
            <p className="text-xs text-stone-500">
              時間軸上で指やマウスを滑らせて、今日の気分の高低をスケッチ（AIが山場のエピソードを重視します）
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setPoints(createInitialPoints())}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-600 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
            title="リセット"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            リセット
          </button>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
        <span className="text-stone-400 font-medium text-[11px]">クイック波型:</span>
        <button
          onClick={() => applyPreset('flat')}
          className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
        >
          穏やか
        </button>
        <button
          onClick={() => applyPreset('high_afternoon')}
          className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
        >
          昼に盛り上がり
        </button>
        <button
          onClick={() => applyPreset('rollercoaster')}
          className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
        >
          波乱万丈
        </button>
        <button
          onClick={() => applyPreset('night_owl')}
          className="px-2.5 py-1 rounded-full bg-white border border-stone-200 text-stone-600 hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
        >
          夜型ハイテンション
        </button>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="relative w-full bg-white rounded-xl border border-amber-200/90 shadow-inner overflow-hidden select-none">
        {/* Top/Bottom Indicator Labels */}
        <div className="absolute top-2 left-3 flex items-center gap-1 text-[11px] font-medium text-amber-700 pointer-events-none">
          <Smile className="w-3.5 h-3.5 text-amber-500" />
          <span>最高（ハイ）</span>
        </div>
        <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[11px] font-medium text-indigo-600 pointer-events-none">
          <Frown className="w-3.5 h-3.5 text-indigo-400" />
          <span>ロー（落ち着き・テンション低）</span>
        </div>

        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full touch-none cursor-crosshair block"
        />
      </div>

      {/* Today's Mapped Moments Bar */}
      {moments.length > 0 && (
        <div className="pt-1 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-semibold text-stone-700">時間軸上の投稿素材 ({moments.length}件):</span>
            <span className="text-[11px] text-stone-400">ピンをタップして内容を確認</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {moments.map((m) => {
              const d = m.createdAt?.toDate ? m.createdAt.toDate() : new Date(m.createdAt);
              const timeStr = !isNaN(d.getTime())
                ? d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMoment(activeMoment?.id === m.id ? null : m)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shrink-0 transition-all cursor-pointer ${
                    activeMoment?.id === m.id
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-stone-700 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  {getMomentIcon(m.type)}
                  <span className="font-mono text-[11px] font-semibold">{timeStr}</span>
                  <span className="truncate max-w-[120px]">{m.content || '無題の投稿'}</span>
                </button>
              );
            })}
          </div>

          {/* Active Moment Preview Box */}
          {activeMoment && (
            <div className="p-3 bg-white rounded-xl border border-amber-300 shadow-xs flex items-center gap-3 animate-fade-in text-xs">
              {activeMoment.mediaUrl && (
                <img
                  src={activeMoment.mediaUrl}
                  alt="preview"
                  className="w-12 h-12 object-cover rounded-lg shrink-0 border border-stone-200"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-stone-800 truncate">{activeMoment.content}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  波の高さに応じて、AIがこの投稿の印象や感情表現の強弱を調整します。
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Action CTA */}
      <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
        <div className="text-xs text-stone-500">
          波の振り幅の大きい時間帯の出来事をAIが優先的に日記のエピソードにします
        </div>

        <button
          id="btn-generate-with-wave"
          onClick={() => onGenerateWithWave(points)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-98 cursor-pointer text-xs"
        >
          <Sparkles className="w-4 h-4" />
          この気分の波で日記を作成する
        </button>
      </div>
    </div>
  );
};
