import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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
    const { moments, date, diaryStyle = "poetic", userDisplayName = "ユーザー" } = req.body;

    if (!moments || !Array.isArray(moments) || moments.length === 0) {
      return res.status(400).json({ error: "投稿（モーメント）がひとつも指定されていません。" });
    }

    const ai = getGenAI();

    // Prepare moments description
    const momentsSummary = moments.map((m: any, idx: number) => {
      const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';
      let typeLabel = "【つぶやき】";
      if (m.type === "image") typeLabel = "【写真添付投稿】";
      if (m.type === "audio") typeLabel = "【音声メモ投稿】";
      if (m.type === "video") typeLabel = "【動画メモ投稿】";
      const moodText = m.mood ? ` (気分: ${m.mood})` : '';
      return `${idx + 1}. [${timeStr}] ${typeLabel}${moodText}: ${m.content}`;
    }).join("\n");

    const stylePrompts: Record<string, string> = {
      poetic: "叙情的で情緒豊かな詩的スタイルの日記。美しい日本語表現と情景描写を重んじる。",
      warm: "優しく温かい語り口調。まるで親しい友人に語りかけるような、心和む日記。",
      novelist: "まるで短編小説のような物語調。情景や心理描写をドラマチックに描く。",
      funny: "ユーモアたっぷりで少しクスッと笑える親しみやすい明るい日記。",
      concise: "シンプルで読みやすい、すっきりとまとまった現代的なスタイル。",
      empathic: "自分自身の感情に寄り添い、労いと自己肯定感が高まる優しい日記。"
    };

    const chosenStyle = stylePrompts[diaryStyle] || stylePrompts.poetic;

    const systemInstruction = `あなたはユーザーの1日の断片的な投稿（テキスト、写真のメモ、音声メモ、動画メモ）を紡ぎ合わせて、世界に一つだけの美しい「AI日記」を自動執筆するゴーストライターAIです。

文体スタイル指示:
${chosenStyle}

執筆のガイドライン:
1. 提供された各投稿の時系列や感情の変化、共通のテーマを見つけ出し、一つのストーリーに織り上げてください。
2. 断片的なつぶやきからその背景にある情景や感情、匂い、空気感を豊かにイメージして描写してください。
3. 箇条書きの丸写しではなく、章立て（Markdownの見出し）や段落を使って読み応えのある日記（全文で500〜1000文字程度）に仕上げてください。
4. Markdown形式で視覚的に美しくレイアウトしてください（適宜絵文字や太字を使用）。
5. ユーザー（${userDisplayName}さん）の一日を労い、肯定する温かいメッセージも含めてください。`;

    const prompt = `日付: ${date}
ユーザー名: ${userDisplayName}

【本日投稿されたモーメント（投稿一覧）】:
${momentsSummary}

上記の投稿をもとに、本日の日記を生成し、JSON形式で出力してください。`;

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
              description: "今日という日を象徴する印象的で魅力的な日記のタイトル",
            },
            content: {
              type: Type.STRING,
              description: "Markdown形式の本文（見出し、見やすい段落、絵文字を含む日記）",
            },
            summary: {
              type: Type.STRING,
              description: "SNSタイムライン用の1〜2文の短く美しい要約",
            },
            mood: {
              type: Type.STRING,
              description: "一日の主な気分・一文字〜数文字のキーワード（例: 「穏やかな充実感」「発見のとき」「ほっこり休息」「前進の一歩」）",
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "関連するタグ（3〜5個、例: ['カフェ', '夕焼け', '読書']）",
            },
            aiReflection: {
              type: Type.STRING,
              description: "AIからユーザーへの明日への一言エール・問いかけメッセージ",
            },
            imagePrompt: {
              type: Type.STRING,
              description: "今日の日記のカバーイラストを描くための詳細な英語プロンプト（水彩画風、温かいタッチ等）",
            },
          },
          required: ["title", "content", "summary", "mood", "tags", "aiReflection", "imagePrompt"],
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

    // Use gemini-3.1-flash-lite-image or image fallback
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-image",
        contents: {
          parts: [
            {
              text: `Artistic, peaceful digital watercolor illustration depicting this scene: ${prompt}. Soft aesthetic colors, cozy diary cover art style, high visual quality, no text overlay.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

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
    } catch (imgError: any) {
      console.warn("Gemini Image generation failed, falling back to curated visual:", imgError?.message);
    }

    // Fallback image using high quality curated seed image if model call is restricted or fails
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
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
