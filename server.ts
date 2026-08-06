import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Increase payload limit for base64 image & audio uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize GenAI
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy-key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoints

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Generate Daily AI Diary from Moments
app.post("/api/generate-diary", async (req, res) => {
  try {
    const { moments, date, diaryStyle = "natural", userDisplayName = "ユーザー", wavePoints } = req.body;

    if (!moments || !Array.isArray(moments) || moments.length === 0) {
      return res.status(400).json({ error: "投稿（モーメント）がひとつも指定されていません。" });
    }

    const ai = getGenAI();

    // Analyze wave high/low peaks if wavePoints provided
    let waveSummaryPrompt = "";
    if (Array.isArray(wavePoints) && wavePoints.length > 0) {
      const highPeaks = wavePoints.filter((p: any) => p.score >= 40).map((p: any) => `${p.hour}時頃(高テンション)`).join(", ");
      const lowPeaks = wavePoints.filter((p: any) => p.score <= -40).map((p: any) => `${p.hour}時頃(テンション低下・落ち着き)`).join(", ");
      
      waveSummaryPrompt = `\n【ユーザーが描いた気分の波（24時間感情データ）】:
- 感情が高まった時間帯（メインエピソード重み大）: ${highPeaks || "特になし（平穏）"}
- 感情が落ち着いていた/沈んでいた時間帯: ${lowPeaks || "特になし（平穏）"}
- 指示: 感情の高ぶり（振り幅の大きい時間帯）に対応する投稿のできごとを日記の中心（メインエピソード）として生き生きと描写し、平坦な時間帯は背景として自然に繋いでください。`;
    }

    // Prepare moments description
    const momentsSummary = moments.map((m: any, idx: number) => {
      const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
      let typeLabel = "【つぶやき】";
      if (m.type === "image") typeLabel = "【写真添付投稿】";
      if (m.type === "audio") typeLabel = "【音声メモ投稿】";
      if (m.type === "video") typeLabel = "【動画メモ投稿】";
      return `${idx + 1}. [${timeStr}] ${typeLabel}: ${m.content}`;
    }).join("\n");

    const stylePrompts: Record<string, string> = {
      natural: "投稿者の言葉遣いや雰囲気をそのまま活かした、自然で素朴な日記文章。不自然な飾り立てや詩的表現は避け、本人の声がそのまま届く文章にする。",
      neat: "投稿の事実関係を整理し、読みやすくすっきりと整えた日誌スタイル。",
      casual: "親しみやすく明るい、日常のメモを素直につなげたカジュアルな文章。",
      concise: "余計な言葉を削ぎ落とし、その日の出来事と感想をコンパクトにまとめたスタイル。"
    };

    const chosenStyle = stylePrompts[diaryStyle] || stylePrompts.natural;

    const systemInstruction = `あなたはユーザーの日々の投稿メモ（テキスト、写真、音声メモ）と気分の波データをもとに、1日のまとめ手帳日記を作成するAI編集者です。

【最重要4大編集ルール】
1. オウム返しの禁止: 単なる単語や箇条書きの丸写しではなく、時間の経過や文脈が自然に伝わる読みやすい「日記文章」へ昇華させてください。
2. 生の言葉の尊重: ユーザー独自の言い回し、スラング、語尾、絵文字は変えずにそのまま生かしてください。
3. 捏造・過剰演出の禁止: 入力されていない事実の創作や、大げさでロボット的なポエム演出は一切行わないでください。
4. 時間表記の柔軟性: 基本は「昼過ぎ」「夕方」など日常的な時間帯表現を使いますが、文脈上自然で必要な場合は具体表記も可とします。

文体スタイル:
${chosenStyle}`;

    const prompt = `日付: ${date}
ユーザー名: ${userDisplayName}

【本日投稿されたメモ一覧】:
${momentsSummary}${waveSummaryPrompt}

上記の投稿と気分の波をもとに、本人の言葉のよさを活かした自然な日記を作成し、JSON形式で出力してください。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "今日のできごとを表す自然でシンプルな日記のタイトル",
            },
            content: {
              type: Type.STRING,
              description: "Markdown形式の本文（本人のトーンを活かした自然な日記文章）",
            },
            summary: {
              type: Type.STRING,
              description: "1〜2文のシンプルな要約",
            },
            imagePrompt: {
              type: Type.STRING,
              description: "今日の日記のカバー写真のための英語プロンプト（温かみのあるシンプルな日常写真風）",
            },
          },
          required: ["title", "content", "summary", "imagePrompt"],
        },
      },
    });

    const resultText = response.text || "{}";
    const diaryData = JSON.parse(resultText);

    res.json({ success: true, diary: diaryData });
  } catch (error: any) {
    console.error("Error in /api/generate-diary:", error);
    res.status(500).json({ error: error?.message || "日記の生成に失敗しました。" });
  }
});

// 3. Generate Cover Image for Diary
app.post("/api/generate-cover", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "プロンプトが指定されていません。" });
    }

    const ai = getGenAI();

    // Try image generation models with graceful fallback if quota is exceeded
    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: "imagen-3.0-generate-002",
          contents: {
            parts: [
              {
                text: `Peaceful natural photographic style depicting this scene: ${prompt}. Warm lighting, natural colors, cozy everyday photo style, high quality, no text overlay.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        });
      } catch {
        response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [
              {
                text: `Peaceful natural photographic style depicting this scene: ${prompt}. Soft aesthetic colors, cozy diary cover art style, high visual quality, no text overlay.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        });
      }

      let imageUrl = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        return res.json({ success: true, imageUrl });
      }
    } catch {
      // Quietly use curated visual fallback when quota is reached
    }

    // Fallback image using high quality curated seed image
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 30));
    const fallbackUrl = `https://picsum.photos/seed/${encodedPrompt}/1200/675`;

    res.json({ success: true, imageUrl: fallbackUrl });
  } catch (error: any) {
    console.error("Error in /api/generate-cover:", error);
    res.status(500).json({ error: error?.message || "カバー画像の生成に失敗しました。" });
  }
});

// 4. Generate TTS Audio Narration for Diary
app.post("/api/generate-tts", async (req, res) => {
  try {
    const { text, voiceName = "Kore" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "テキストが指定されていません。" });
    }

    const ai = getGenAI();

    // Clean text for TTS (remove markdown hashtags, headers, etc)
    const cleanText = text.replace(/[#*`_-]/g, "").slice(0, 800);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `朗読: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const mimeType = response.candidates[0].content.parts[0].inlineData?.mimeType || "audio/wav";
      const audioUrl = `data:${mimeType};base64,${base64Audio}`;
      return res.json({ success: true, audioUrl });
    }

    res.status(500).json({ error: "音声データの生成に失敗しました。" });
  } catch (error: any) {
    console.error("Error in /api/generate-tts:", error);
    res.status(500).json({ error: error?.message || "音声朗読の生成に失敗しました。" });
  }
});

// 5. Generate AI Community Reader Comment
app.post("/api/generate-ai-comment", async (req, res) => {
  try {
    const { diaryTitle, diaryContent, authorName } = req.body;
    if (!diaryTitle || !diaryContent) {
      return res.status(400).json({ error: "日記データが不足しています。" });
    }

    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `あなたはSNSの温かい読者仲間「AIフレンド（ココロ）」です。
${authorName || "投稿者"}さんの日記を読んで、共感し、心が温まる短く優しいコメント（2〜3文、絵文字つき）を一つ書いてください。

【日記のタイトル】: ${diaryTitle}
【日記の内容抜粋】: ${diaryContent.slice(0, 300)}`,
      config: {
        systemInstruction: "読者として共感と労いを伝える心温まるコメントを日本語で作成してください。",
      },
    });

    const commentText = response.text || "とても素敵で心温まる日記ですね！共有してくれてありがとうございます✨";
    res.json({ success: true, comment: commentText });
  } catch (error: any) {
    console.error("Error in /api/generate-ai-comment:", error);
    res.status(500).json({ error: error?.message || "AIコメント生成に失敗しました。" });
  }
});

// Vite Middleware for development & Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        maxAge: "1d",
        etag: true,
        setHeaders: (res, filepath) => {
          if (filepath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          } else if (filepath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      })
    );
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

export { app };

if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT && !process.env.VERCEL) {
  startServer();
}

