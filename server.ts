import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * Handle AI-guided financial gap and insurance analysis
 */
app.post("/api/analyze-gap", async (req, res) => {
  const { calculatorInput, activeCategory } = req.body;

  if (!calculatorInput) {
    return res.status(400).json({ error: "Calculator input data is required" });
  }

  try {
    const ai = getGeminiClient();

    const prompt = `
您是香港投資者及理財教育委員會（IFEC / 錢家有道）的資深保險及理財規劃專家。
請根據以下使用者的基本財務與保障狀況，進行深度的保障缺口評估及保險規劃分析。分析必須高度客觀、實用、符合香港保險市場守則，並以繁體中文撰寫。

使用者財務狀況：
- 年齡: ${calculatorInput.age} 歲
- 每月收入: HK$${calculatorInput.monthlyIncome}
- 受養人人數: ${calculatorInput.dependents} 人
- 每月開支（包括家庭生活費、供樓、養育子女等）: HK$${calculatorInput.monthlyExpenses}
- 按揭或其他債務總額: HK$${calculatorInput.mortgageDebt}
- 現有壽險保額: HK$${calculatorInput.currentLifeCoverage}
- 現有醫療保障程度: ${calculatorInput.currentMedicalCoverage === "None" ? "無任何醫療保險" : calculatorInput.currentMedicalCoverage === "Basic" ? "僅有基本僱主團體醫療險" : "已自行投保自願醫保 (VHIS) 或中高端醫療險"}
- 是否有危疾保障: ${calculatorInput.hasCriticalIllness ? "是" : "否"}

當前關注的保險項目或瀏覽中的項目: ${activeCategory || "未指定"}

請進行以下規劃計算：
1. 壽險需求估算公式（參考錢家有道推薦方式，例如：受養人保障金額 = 每月家庭開支 × 12個月 × 需要扶養的年期 + 債務總額 - 現有保額）。
2. 評估醫療保險是否充足（是否需要自願醫保 VHIS、補足免賠額等）。
3. 評估危疾保險是否有缺口（一般建議為年收入的 2 至 3 倍以防範患病期間的收入損失）。

請 formulate 一個精確的評估報告，並嚴格按照以下 JSON 結構回傳。
回傳的內容必須為標準的 JSON 格式（不要在回傳字串前後包裹 \`\`\`json 等 Markdown 包裹符號，只回傳純 JSON 字串）：

{
  "evaluation": "一段約 150-200 字的整體财务與保障狀況專業評估。指出當前最重要的保障盲點（例如：扶養責任重但壽險不足、或危疾保障空白）。",
  "gapsRisk": [
    "保障缺口風險 1（例如：若不幸遇上意外，現有的 HK$XX 壽險難以覆蓋 HK$XX 按揭負擔，會讓家人承受債務壓力。）",
    "保障缺口風險 2（例如：全賴公司醫保，一旦離職或退休將失去保障，且基本團體醫保通常不設保證續保。）",
    "保障缺口風險 3"
  ],
  "productSuggestions": [
    {
      "type": "保險種類（例如：人壽保險、自願醫保 (VHIS)、危疾保險、家居保險、旅遊保險）",
      "reason": "具體的建議原因，並指出建議的保額估算或保障要點（例如：建議增購定期壽險，保額約 HK$XXXX,XXX，以覆蓋按揭及未來10年家庭開支）。",
      "priority": "HIGH" (可選值為 "HIGH", "MEDIUM", "LOW")
    },
    {
      "type": "保險種類",
      "reason": "建議原因與保額配置要點。",
      "priority": "MEDIUM"
    }
  ],
  "educationalTakeaway": "一句精華金句，總結錢家有道的保險精明錦囊（例如：買保險應『先保障，後投資』，先配齊基本醫療與人壽，再考慮其他儲蓄型保險。避免因小失大。）"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    if (error.message && error.message.includes("GEMINI_API_KEY")) {
      return res.status(401).json({
        error: "Missing API Key",
        details: "未配置 GEMINI_API_KEY。請於 Settings > Secrets 設定 key 以啟用智慧保險缺口評估功能。",
      });
    }
    res.status(500).json({
      error: "無法生成智能評估報告。",
      details: error.message,
    });
  }
});

/**
 * Chat with insurance expert to answer user queries based on IFEC insurance guides
 */
app.post("/api/chat", async (req, res) => {
  const { messages, calculatorInput, insuranceType } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages list is required" });
  }

  try {
    const ai = getGeminiClient();

    // Context details from IFEC Guideline
    const context = `
您是香港投資者及理財教育委員會（IFEC / 錢家有道）的保險教育專家諮詢助手。
您的任務是以客觀、中立、非銷售推廣、純理財教育的角度解答香港市民關於保險的疑問：

【錢家有道保險教育核心守則】：
1. 絕不推銷任何具體的保險公司、品牌或產品項目。
2. 強調「先保障，後儲蓄」的健康理財觀念。
3. 指導市民如何合理評估保障額度，留意不保事項（Exclusions）、等候期、免賠額（Deductibles）等關鍵字。
4. 解釋自願醫保計劃（VHIS）的優點（如：扣稅、保證續保、覆蓋未已知既往症）。
5. 保持語氣親切、專業、客觀中立、實用。

當前使用者關注的保險項目：${insuranceType ? `${insuranceType.name} (${insuranceType.engName})` : "整體保險規劃"}
${calculatorInput ? `使用者當前計算機財務背景：
- 年齡: ${calculatorInput.age}
- 半年/月收入: HK$${calculatorInput.monthlyIncome}
- 受養親屬: ${calculatorInput.dependents} 人
- 每月開支: HK$${calculatorInput.monthlyExpenses}
- 現有債務: HK$${calculatorInput.mortgageDebt}` : ""}

請針對使用者的提問，給予權威而淺顯易懂的繁體中文解答。
`;

    const chatHistory = messages.map((m: any) => ({
      role: m.role,
      contents: m.content
    }));

    // Find the latest user message
    const lastUserMessage = messages[messages.length - 1]?.content || "";

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: context,
      },
    });

    const response = await chat.sendMessage({
      message: lastUserMessage,
    });

    res.json({
      content: response.text || "非常抱歉，我目前無法為您解答。請稍後再試。",
    });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    if (error.message && error.message.includes("GEMINI_API_KEY")) {
      return res.status(401).json({
        error: "Missing API Key",
        details: "未配置 GEMINI_API_KEY。請於 Settings > Secrets 設定 key 以啟用智慧諮詢平台。",
      });
    }
    res.status(500).json({
      error: "專家對話連線失敗。",
      details: error.message,
    });
  }
});

// ----------------------------------------------------
// VITE OR STATIC STATIC MIDDLEWARE
// ----------------------------------------------------
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
