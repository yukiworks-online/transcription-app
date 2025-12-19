import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const TRANSCRIPTION_PROMPT_SYSTEM = `
# Role
あなたはプロの文字起こしスペシャリストです。提供された音声ファイルを聞き、忠実かつ正確な日本語の書き起こし原稿を作成することがあなたの任務です。

# Task
音声の内容を、「ケバ取り」形式で書き起こしてください。
過度な編集や要約は行わず、発言内容を一言一句正確に文字にすることを最優先してください。

# Guidelines
1. **フィラーの削除（ケバ取り）**:
   - 「あー」「えーと」「あの」「そのー」などの意味を持たないフィラーワード（言い淀み）のみを削除してください。
   - ただし、文脈上意味のある「はい」「ええ」などの相槌や、否定・肯定に関わる重要な言葉は削除しないでください。

2. **原文の保持（重要）**:
   - 文章を短くしたり、要約したり、勝手に整文（意訳）しないでください。
   - 話者が言い間違えて言い直した場合も、可能な限りそのまま記録してください（例：「昨日の…一昨日のデータですが」）。
   - 文末のニュアンス（「〜ですけど」「〜だよね」など）を変えないでください。

3. **話者の識別**:
   - 異なる話者を「話者A」「話者B」などで明確に区別してください。

4. **不明瞭な箇所**:
   - どうしても聞き取れない箇所は [聞き取り不能] と記述し、勝手に推測して埋めないでください。

# Output Format
要約は不要です。以下のような形式で、会話の全容を出力してください。

【話者A】: 発言内容...
【話者B】: 発言内容...
`;

const MINUTES_PROMPT_SYSTEM = `
# 命令書
あなたは優秀なプロダクトマネージャー兼UXリサーチャーです。
以下の[文字起こしテキスト]をもとに、CPF（Customer Problem Fit）およびPSF（Problem Solution Fit）の検証を目的とした「構造化された議事録」を作成してください。

単なる要約ではなく、顧客の「熱量」「痛みの深さ」「建前と本音」を読み取り、ビジネスの意思決定に役立つインサイトを抽出することを最優先してください。

# 制約条件
- 事実（Fact）と解釈（Insight）を混同しないこと。
- 顧客が強く感情を込めたり、繰り返したりした箇所は「重要」とみなすこと。
- 不明な情報は無理に埋めず「記載なし」とすること。
- 出力は以下の[出力フォーマット]を厳守すること。

# 出力フォーマット

## 1. 基本情報（テキストから推定）
- **顧客属性:** [企業規模/役職/業界などを推定して記載]
- **推定される検証仮説:** [会話の流れから、インタビュアーが何を検証しようとしていたか推測して記載]

## 2. ヒアリング・検証ログ
### A. 顧客の現状と課題 (CPF)
| 検証項目 | 顧客の発言要約・事実（Fact） | 重要度/感情 (高/中/低) |
| :--- | :--- | :--- |
| **背景・業務フロー** | | |
| **課題発生のトリガー** | | |
| **課題の深刻度(Pain)** | | |
| **既存の代替手段** | | |
| **代替手段への不満** | | |

### B. 解決策の提示と反応 (PSF)
※解決策の提示があった場合のみ記入
| 検証項目 | 顧客の反応・フィードバック（Fact） | 評価 (ポジ/ネガ) |
| :--- | :--- | :--- |
| **第一印象・反応** | | |
| **最も価値を感じた点** | | |
| **懸念点・導入障壁** | | |
| **支払意欲・価格感** | | |

## 3. インサイト抽出・分析（プロによる分析）
- **💡 新たな発見:** [想定外の事実やユースケース]
- **⚠️ 仮説とのギャップ:** [インタビュアーの想定と異なっていた点]
- **🔥 強いシグナル:** [顧客が前のめりになった瞬間や、強い言葉]
- **🚦 検証結果判定(案):** [Valid / Invalid / Pending] とその理由
`;

async function fileToGenerativePart(file: Blob, mimeType: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return {
        inlineData: {
            data: buffer.toString("base64"),
            mimeType,
        },
    };
}

async function tryGenerate(modelName: string, prompt: string, filePart?: any) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const content = filePart ? [prompt, filePart] : [prompt];
        const result = await model.generateContent(content);
        return result.response.text();
    } catch (error) {
        throw error;
    }
}

export async function POST(req: NextRequest) {
    if (!process.env.GOOGLE_API_KEY) {
        return NextResponse.json({ error: "GOOGLE_API_KEY is not set" }, { status: 500 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Step 1: Transcription
        // Strategy: Gemini 3 Flash Preview -> Gemini 2.5 Flash -> Gemini 2.0 Flash
        const filePart = await fileToGenerativePart(file, file.type);
        let transcript = "";

        // Primary: Gemini 3 Flash (As requested)
        let usedModel = "gemini-3-flash-preview";

        try {
            console.log(`Attempting transcription with ${usedModel}...`);
            transcript = await tryGenerate("gemini-3-flash-preview", TRANSCRIPTION_PROMPT_SYSTEM, filePart);
        } catch (e: any) {
            console.warn(`${usedModel} failed (Attempt 1). Error: ${e.message}`);

            // Retry Strategy: Downgrade to 2.5 Flash
            usedModel = "gemini-2.5-flash";
            console.warn(`Falling back to ${usedModel}...`);

            try {
                transcript = await tryGenerate("gemini-2.5-flash", TRANSCRIPTION_PROMPT_SYSTEM, filePart);
            } catch (e2: any) {
                console.warn(`${usedModel} failed. Error: ${e2.message}`);

                // Final Fallback: Gemini 2.0 Flash (Stable)
                usedModel = "gemini-2.0-flash";
                console.warn(`Falling back to ${usedModel}...`);

                try {
                    transcript = await tryGenerate("gemini-2.0-flash", TRANSCRIPTION_PROMPT_SYSTEM, filePart);
                } catch (e3: any) {
                    console.warn(`All models failed. Last error: ${e3.message}`);
                    throw new Error(`All transcription models failed. Please try again later. (${e3.message})`);
                }
            }
        }

        // Step 2: Minutes
        // Use the same successful model for consistency
        let minutes = "";
        const minutesPrompt = `${MINUTES_PROMPT_SYSTEM}\n\n---\n\nTRANSCRIPT:\n${transcript}`;

        try {
            minutes = await tryGenerate(usedModel, minutesPrompt);
        } catch (e: any) {
            console.warn(`Minutes generation failed with ${usedModel}. Error: ${e.message}`);

            // One last try with the most stable model if we aren't already on it
            if (usedModel !== "gemini-2.0-flash") {
                console.warn("Falling back to gemini-2.0-flash for minutes");
                minutes = await tryGenerate("gemini-2.0-flash", minutesPrompt);
                usedModel += " (2.0 Flash fallback)";
            } else {
                throw e;
            }
        }

        return NextResponse.json({
            transcript,
            minutes,
            meta: {
                modelUsed: usedModel
            }
        });

    } catch (error: any) {
        console.error("Processing error:", error);
        return NextResponse.json(
            { error: error.message || "An error occurred during processing" },
            { status: 500 }
        );
    }
}
