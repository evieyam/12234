import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Heart, 
  Sparkles, 
  HelpCircle, 
  Calculator, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Send, 
  RefreshCw, 
  BookOpen, 
  Info, 
  ArrowRight,
  ShieldCheck,
  Plane,
  Home,
  Car,
  ChevronDown,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { Message, InsuranceTypeInfo, GapCalculatorInput, AIAnalysisResult } from "./types";

// Static educational content mimicking IFEC/Chin Family (錢家有道) Insurance Section
const INSURANCE_CATEGORIES: InsuranceTypeInfo[] = [
  {
    id: "life",
    name: "人壽保險",
    engName: "Life Insurance",
    icon: "Shield",
    description: "為受養人提供財務保障，應付按揭、家庭開支及教育費等。",
    detailedDescription: "人壽保險（壽險）的主要功能是當投保人不幸身故，保險公司向受益人發放一筆過賠償。這有助於維持家人的生活水平，或償還按揭等負債。主要分為「定期壽險」（純保障、無儲蓄成分、保費較便宜）及「終身壽險」（含儲蓄/分紅成分、保費較高但提供長期保障）。",
    keyConcepts: [
      "定期壽險：只在合約期內（如10年或至60歲）提供人壽保障，沒有儲蓄成分，保費最便宜，適合家庭負擔重、按揭高的人士。",
      "終身壽險：通常保障至終身，包含儲蓄或分紅成分，隨著年期會累積現金價值，但相對保費顯著較高。",
      "受養人需要：投保額應足以支付剩餘各受養人的長期生活費、教育津貼以及家庭債務總額。"
    ],
    purchaseTips: [
      "精算保額：保額計算建議為「（每年家庭開支 + 受養子女教育津貼） × 預計需要年數 + 個人總債務 - 現有高流動性資產」。",
      "先保障，後儲蓄：若預算有限，應優先考慮純保費低的定期壽險以獲得最高保障額。觀念不應本末倒置。"
    ],
    claimTips: [
      "受益人指定：定期檢查壽險受益人設定，確保符合最新家庭實況。",
      "索償文件：需要正式死亡證明書、保單正本及受益人身分證明。"
    ],
    mustKnows: [
      "受保權益（Insurable Interest）：投保人與受保人之間必須存在可保權益，例如夫妻、父母子女或債權人與債務人。",
      "最高誠信（Utmost Good Faith）：必須對健康狀況、抽煙習慣核實申報。任何漏報或隱瞞皆可面臨保單作廢拒賠。"
    ]
  },
  {
    id: "medical",
    name: "醫療及健康保險",
    engName: "Medical & Health",
    icon: "Heart",
    description: "補償因患病或意外入院的醫療開支。強烈推薦自願醫保計劃 (VHIS)。",
    detailedDescription: "醫療保險採用實銷實報機制，賠償因病留院或進行特定日間手術的開支（如病房、手術費、藥費及巡房費等）。私家醫療費用在香港十分高昂，合理的醫療健康保障是家庭風險管理的基石。自願醫保計劃 (VHIS) 在保障產品規範、保證續保至 100 歲、覆蓋未已知既往症等方面更具優勢。",
    keyConcepts: [
      "自願醫保 (VHIS)：政府認可及規範的產品，分為「標準計劃」（基本保障）及「靈活計劃」（含更高保額與額外保障），保費可作扣稅用途。",
      "共同保險與免賠額：部分中高端保險設有「免賠額」(Deductible) 或「墊底費」，由投保人自付，墊底費越高保費越便宜，適合補足僱主團體醫保。",
      "住院現金險：不屬於實銷實報，而是按住院天數定額發放，用作彌補住院期間的收入損失。"
    ],
    purchaseTips: [
      "留意不保事項（Exclusions）：如先天性疾病（非自願醫保覆蓋者）、美容手術、既往症等。",
      "理智評估公司醫保：僱主提供的團體醫保保障通常較基本。建議考慮加配一份自願醫保，或選擇高免賠額保單，降低自身保費成本。"
    ],
    claimTips: [
      "醫療卡與預先批核：非緊急手術可向保險公司申請「預先批核（Pre-authorization）」，確保對自付額與保障範圍有數。",
      "單據齊備：索償時需提交詳盡的出院總數收據正本、醫療費用明細表，以及主診醫生簽署填寫的索償申請書。"
    ],
    mustKnows: [
      "保證續保：自願醫保保證續保至100歲，且不限既往症及投保後確診的慢性病，這是普通傳統醫保常缺少的保障。",
      "保費調整：保費會隨年齡增長而調高，且隨醫療通脹率進行調整，投保人需有長期負擔能力的預算規劃。"
    ]
  },
  {
    id: "critical",
    name: "危疾保險",
    engName: "Critical Illness",
    icon: "Sparkles",
    description: "當確診患上指定嚴重疾病時，獲得一筆過特定定額賠償，以應付生活費及特別治療費。",
    detailedDescription: "危疾保險與醫療險不同，一旦確診保單合約列明的特定疾病（如癌症、急性心臟病、中風等嚴重疾病）並符合定義，即獲一次性發放全數保額賠償。這筆資金不受用途限制，既可用作聘請看護、自費購買昂貴的標靶藥，亦可用作確診休養期間的生活費支撐。",
    keyConcepts: [
      "一筆過賠償：無需單據，確診即賠。可用於非醫療層面開支，如償還債務、家庭固定支出或彌補無法工作的收入損失。",
      "受保疾病定義：合約對每種疾病（如癌症）均有非常細緻的醫學界定（例如：必須達到特定期數或嚴重程度方可獲賠）。",
      "多重賠償（Multi-claim）：部分新型危疾險保障多次嚴重疾病，但每次之間設有一段「等候期」（如1-3年）。"
    ],
    purchaseTips: [
      "建議保額：一般理財指引建議危疾保額應相當於「2 至 3 年的個人年收入」，確保治病休養期间生活無憂。",
      "定期與終身危疾：定期危疾保費較便宜，但後期可能因年老保費大增或無法續保；終身危疾含儲蓄成分，保費穩定但較昂貴。"
    ],
    claimTips: [
      "醫學證明尤為關鍵：必須由合資格專科醫生出具符合保單條款嚴格定義之確診檢查報告與病理學證明。",
      "等候期與生存期：有些保單會規定投保人在確診危疾後，需存活特定天數（例如14天）才可獲賠償。"
    ],
    mustKnows: [
      "核保誠信：若過往有心臟、血壓等慢性病史，投保時必須誠實申報，否則當發生危疾衍生時可能會面臨拒賠。",
      "等候期限制：新投保保單通常有60天至90天的等候期（Waiting Period），在此期間確診的疾病將不獲保障。"
    ]
  },
  {
    id: "general",
    name: "旅遊、家居及綜合保險",
    engName: "General Insurance",
    icon: "Plane",
    description: "保障旅途意外、家居物業損失及第三者責任等一般生活財產風險。",
    detailedDescription: "一般及財產保險涵蓋範圍多元。旅遊保險提供旅途中的緊急醫療援助、行李/行程延誤補償；家居保險與火險（樓宇結構險）則共同防範水浸、火災等突發事件對物業及家具財物造成的損失，部分更承保極為關鍵的第三者責任保險。",
    keyConcepts: [
      "物業火險（宇結構險）：保障大廈等結構，一般由物業管理處或銀行供樓強制要求購買，保額通常即重置成本。",
      "家居保險：保障屋內的私人及家庭財物（如電腦、電器、貴重首飾），並常包含高達數百萬的「第三者法律責任保障」。",
      "旅遊險的緊急救援：在境外遇到意外或疾病時，能否獲得24小時緊急醫療運送及墊付醫療費用是非常重要的考量極限。"
    ],
    purchaseTips: [
      "旅遊險應在「預訂行程當天」即買：這方能享有自預訂日起，因突發事件導致行程取消或更改的相關前置保障（Early-bird effect）。",
      "家居保險需分清重置價值（Reinstatement value）：申報保額應合適，低報可能會在全損時遭到比例折算賠付。"
    ],
    claimTips: [
      "旅遊索償證據：如因病看醫需保留當地正式醫學診斷、醫療收據正本；行李/行程延誤則需獲取航空公司、港口公共交通機構出具的書面延誤證明。",
      "家居損失需拍照保存：一旦發生家居水漫、火災等，切勿立即丟棄損壞財物，應即時拍照存檔，並向物業管理處登記報告。"
    ],
    mustKnows: [
      "第三者責任險的重要：在家居疏忽（例如冷氣機滴水擊傷路人、爆水喉浸透樓下天花板）時，第三者責任險是提供法律賠償與訴訟防禦的強大盾牌。",
      "不保高危運動：旅遊險通常對如高空彈跳、深海潛水或專業性競賽有特定高度要求或免責限制，購買前必須確認。"
    ]
  },
  {
    id: "accident",
    name: "意外及傷殘保險",
    engName: "Accident & Disability",
    icon: "ShieldCheck",
    description: "彌補由意外事故造成的身故、斷肢、失明或暫時失去工作能力的財務威脅。",
    detailedDescription: "意外保險針對「因外來、突發、非疾病」導致的身體損傷提供賠償。除了意外身故賠償，最核心的是「傷殘賠償」和額外附加的「意外醫療費實銷實報」。這對於需要勞動、非固定桌台工作的市民，或者家庭唯一經濟支柱來說是極其基本的心安配置。",
    keyConcepts: [
      "意外定義嚴格：必須同時滿足「外來、突發、不可預料、非因罹病」等四大要件。例如因個人暗病或高血壓昏倒受傷，通常不屬於意外險保障範圍。",
      "傷殘比例表：賠償額通常按傷殘嚴重程度的百分比分配（如：失去單眼或單肢賠償保額的50%，永久完全殘廢賠償100%）。",
      "暫時性喪失工作能力保障：按週發放定額津貼，幫助停工休養人暫度經濟難關。"
    ],
    purchaseTips: [
      "職業組別的直接關係：意外險保費與投保人的「职业危險等級」直接掛鈎，而非年齡。如建築工人保費顯著高於會計師，更換職業時必須及時通知保險公司進行背書調整。",
      "性價比高：不含儲蓄兼核保相對簡單，提供大額身故與殘廢保障，適合作為年輕一族及高危工作者最初步的防線。"
    ],
    claimTips: [
      "意外事件佐證：如遇上交通、治安刑事意外，應警署備案並取得警方證明書，以及急症室初診報告。",
      "時間規定期限：意外事件發生後，通常要求在 30 天內向保險公司發出索償口頭或書面書面通知。"
    ],
    mustKnows: [
      "非醫療保險：意外死亡及斷肢保障是一筆過定額給付，而意外醫療實報實銷險才是應付撞傷門診費用、物理治療等小型花銷。",
      "職業未申報後果：更換危險職業但未如實申報，一旦發生工傷事故，保險公司有可能比例退回保費或直接拒賠。"
    ]
  }
];

// static general FAQ of HK Insurance (The Chin Family spirit)
const GENERAL_FAQS = [
  {
    q: "買保險可以「扣稅」嗎？有哪些計劃符合資格？",
    a: "在香港，現時合資格扣稅的保險產品主要有：自願醫保計劃 (VHIS)，個人保費扣稅上限為每年 HK$8,000；合資格延期年金計劃 (QDAP)，與強積金自願性供款 (TVC) 合併計算，個人扣稅上限為每年合共 HK$60,000。這為市民規劃退休及健康管理提供了良好政策诱因。"
  },
  {
    q: "保險有「冷靜期」嗎？冷靜期內退保有何手續？",
    a: "為了保護消費者，香港人壽保險、年金等長期險均設有至少「21天」的冷靜期（自保險公司交付保單或發出冷靜期通知書起計，以較早者為準）。在此期間，投保人只要未曾提出過索償，均可向保險公司發出書面通知要求撤銷保單並獲全數退還已交保費。"
  },
  {
    q: "什麼是「 Utmost Good Faith（最高誠信）」？不誠實申報有何後果？",
    a: "最高誠信是保險合約的法律基礎。這代表投保人必須在投保時，向保險公司詳實申報所有實質事實（Material Facts），特別是既往病史、吸煙與否、或高風險愛好。若投保人蓄意隱瞞或漏報（即使主觀上認為「沒關係」），一旦事後被徹查，保險公司有權單方面宣告保單合約作廢（Void），拒絕履行賠償，且很可能不退還已交保費。"
  },
  {
    q: "「墊底費」 （免賠額 / Deductible） 是什麼？如何利用它省保費？",
    a: "「墊底費」是指當發生保險索償時，投保人需要自行承擔的首筆損失金額，其後的醫療或財產金額才由保險公司賠償。例如自願醫保設有 HK$20,000 墊底費，而某次出院總開支為 HK$80,000，您需先自行支付 HK$20,000，保險公司再為您實銷賠償 HK$60,000。含有墊底費的保單，保費通常會大幅折減 30% 到 50% 不等，非常適合本身已持有公司基本醫保，希望配一套高端保障作為升級的市民。"
  }
];

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"wiki" | "calculator" | "expert">("wiki");
  
  // Selected knowledge topic state
  const [activeCategory, setActiveCategory] = useState<InsuranceTypeInfo>(INSURANCE_CATEGORIES[0]);
  
  // FAQ accordion active state
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // States for standard dynamic local assessment calculator
  const [calculatorInput, setCalculatorInput] = useState<GapCalculatorInput>({
    age: 30,
    monthlyIncome: 25000,
    dependents: 1,
    monthlyExpenses: 15000,
    mortgageDebt: 1000000,
    currentLifeCoverage: 200000,
    currentMedicalCoverage: "Basic",
    hasCriticalIllness: false
  });

  // State to determine if calculation report is loading or fetched
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // States for conversation/chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "歡迎來到錢家保險智囊專家諮詢平台！我是您的理財教育專員，我們由香港投資者及理財教育委員會（IFEC）的保險指導守則出發，協助您理性分析人壽、醫療、危疾及日常家居旅遊等保障。請問今天有甚麼保險理財上的疑惑，或者對自願醫保（VHIS）等產品想深入了解的？",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Trigger quick question option inside chatbot
  const [quickQuestionTriggered, setQuickQuestionTriggered] = useState(false);

  // Toast alert status
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync scroll for chat container
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loadingChat]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  /**
   * Submit to fetch Gemini AI smart dynamic analysis gap assessment report
   */
  const handleCalculateGap = async () => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/analyze-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calculatorInput,
          activeCategory: activeCategory?.name || "人壽及醫療規劃"
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("未檢測到有效理財決策專用 API 金鑰 (GEMINI_API_KEY)。請於系統 Settings > Secrets 設定金鑰。");
        }
        throw new Error(`服務端返回錯誤狀態碼: ${res.status}`);
      }

      const data: AIAnalysisResult = await res.json();
      setAnalysisResult(data);
      showToast("🌸 您的香港保險保障缺口與規劃報告生成成功！");
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "處理理財教育分析時通訊超時，請重新計算。");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  /**
   * Send chat question concerning target insurance coverage to Gemini AI
   */
  const handleSendChatMessage = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const messageContent = presetQuery || chatInput;
    if (!messageContent.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setChatInput("");
    setLoadingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory,
          calculatorInput,
          insuranceType: activeCategory
        })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("未配置 Gemini API Key（請在 Settings 側邊欄增加祕密金鑰）。");
        }
        throw new Error("保險智囊專家線路繁忙，請稍後再試。");
      }

      const data = await res.json();
      const aiMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat failure:", error);
      const errMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: `【系統提醒：AI 服務器離線】 ${error.message || "對話失敗。請先在右上方 Secrets 設定您的 API 憑證後，再向保險顧問發問。"}\n\n💡 建議科普回答範本：若您是問自願醫保（VHIS）好處，其主要優勢為：1. 保證續保至100歲 2. 扣稅上限HK$8,000 3. 21天冷靜期 4. 覆蓋未知的先天性疾病保障。`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setLoadingChat(false);
    }
  };

  // Preset query strings to facilitate dynamic exploration
  const PRESET_QUERIES = [
    { title: "自願醫保 VHIS 優點", query: "我想清楚了解香港的自願醫保計劃（VHIS）跟普通商業醫保比較，具體有什麼優點？買了可以怎麼扣稅？" },
    { title: "如何避開人壽拒賠？", query: "買人壽險時如果健康申报漏了一點點出院紀錄，日後理賠會有誠信糾紛嗎？有什麼冷靜期或其他保障？" },
    { title: "危疾賠償是怎麼定義的？", query: "危疾保險的一筆過賠償（定額給付）定義通常指什麼？如果沒有門診單據，單憑專科確診能夠順利索償嗎？" },
    { title: "家居險與大廈火險分別", query: "大廈物業管理處已經幫大廈買了集體火險，我身為屋主為什麼還需要看家居保險？第三者法律責任重要嗎？" }
  ];

  return (
    <div id="ifec_insurance_root" className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Toast alert system widget */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d9488] text-white px-5 py-3 rounded-xl shadow-xl font-medium flex items-center gap-2 border border-teal-500 text-sm"
          >
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300 animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Main Navigation Header */}
      <header id="app_header" className="bg-white border-b border-slate-200 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Info Header */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 rounded-xl text-white shadow-md flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-teal-100 text-teal-800 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded">金融理財教育</span>
                <span className="text-slate-400 text-xs font-mono">對標香港網頁規範</span>
              </div>
              <h1 className="font-sans font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight mt-0.5">
                錢家保險智囊 <span className="text-teal-600">IFEC SmartGuide</span>
              </h1>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                參考香港投資者及理財教育委員會（錢家有道）保險指引設計的智能評估、科普與規劃諮詢平台 。
              </p>
            </div>
          </div>

          {/* Nav Links Tabs Controller */}
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab("wiki")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "wiki" 
                  ? "bg-white text-teal-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>保險教育百科</span>
            </button>
            <button
              onClick={() => setActiveTab("calculator")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "calculator" 
                  ? "bg-white text-teal-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              <span>保障缺口估算</span>
            </button>
            <button
              onClick={() => setActiveTab("expert")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === "expert" 
                  ? "bg-white text-teal-700 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>AI 專家智囊諮詢</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Tip Info Band */}
      <section id="banner_message" className="bg-teal-50 border-b border-teal-100 px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between text-xs font-medium text-teal-800 gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-teal-600 shrink-0" />
            <span>【錢家有道明智保險概念】：買保險應該<strong>「先保障、後投資」</strong>。應優先配置優質醫療保險與純人壽定額保障，切忌因盲目追求還本儲蓄而導致保額嚴重不足。</span>
          </div>
          <a
            href="https://www.ifec.org.hk/web/tc/financial-products/insurance/index.page"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 underline hover:text-teal-900 flex items-center gap-0.5"
          >
            <span>瀏覽官方保險指南網頁</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </section>

      {/* Main App Workspace layout (Fluid & Fully Responsive Single-Screen container) */}
      <main id="app_main_layout" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Core Educational Wiki (保險百科) */}
          {activeTab === "wiki" && (
            <motion.div
              key="wiki_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: 5 Main Categories Selector (width: 5 cols on lg) */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <span className="text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider">錢家有道 精選類別</span>
                  <h2 className="font-sans font-extrabold text-slate-800 text-lg tracking-tight mt-1 mb-3">香港五大核心保險指南</h2>
                  
                  <div className="flex flex-col gap-2">
                    {INSURANCE_CATEGORIES.map((cat) => {
                      const isSelected = activeCategory.id === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setActiveCategory(cat);
                            showToast(`已切換科普詳情：${cat.name}`);
                          }}
                          className={`w-full p-3.5 rounded-xl transition-all duration-300 text-left border flex items-start gap-3 relative overflow-hidden group ${
                            isSelected 
                              ? "bg-teal-50 border-teal-200 text-teal-900" 
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-600" />
                          )}
                          <div className={`p-2 rounded-lg text-xs shrink-0 mt-0.5 ${
                            isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}>
                            {cat.id === "life" && <Shield className="h-4 w-4" />}
                            {cat.id === "medical" && <Heart className="h-4 w-4" />}
                            {cat.id === "critical" && <Sparkles className="h-4 w-4" />}
                            {cat.id === "general" && <Plane className="h-4 w-4" />}
                            {cat.id === "accident" && <ShieldCheck className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm tracking-tight flex items-center justify-between">
                              <span>{cat.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 block ml-1">{cat.engName}</span>
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-light">
                              {cat.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Link/Call to Action for Calculator */}
                <div className="bg-gradient-to-br from-teal-700 to-teal-900 p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/25 rounded-full blur-xl transform translate-x-10 -translate-y-10" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-200">Interactive Tool</span>
                  <h3 className="font-sans font-bold text-base tracking-tight mt-1">您想了解自己的保障缺口嗎？</h3>
                  <p className="text-xs text-teal-100 font-light mt-1.5 leading-relaxed">
                    使用我們參考香港中產家庭財務指標設計的保障缺口估算器，利用 AI 提供量身定制的客觀精明分析。
                  </p>
                  <button 
                    onClick={() => setActiveTab("calculator")}
                    className="mt-4 px-4 py-2 bg-white text-teal-800 hover:bg-teal-50 transition-all font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <span>即刻進入缺口測算</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Detailed Knowledge Panel (width: 8 cols on lg) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Topic Core Presentation */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                  
                  {/* Category Title Header Banner */}
                  <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-teal-100 text-teal-800 text-xs rounded-lg font-bold uppercase tracking-wider font-mono">
                          IFEC 保險類別百科
                        </span>
                        <span className="text-slate-400 font-mono text-xs">| {activeCategory.engName}</span>
                      </div>
                      <h2 className="font-sans font-extrabold text-[#f1f5f9] mt-2 flex items-center gap-2.5">
                        <span className="text-slate-900 text-2xl tracking-tight font-black">{activeCategory.name}</span>
                      </h2>
                    </div>
                    
                    <button
                      onClick={() => {
                        setActiveTab("expert");
                        showToast(`已跳轉智能諮詢關於【${activeCategory.name}】的疑問`);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto transition-all transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>向 AI 顧問提問此項目</span>
                    </button>
                  </div>

                  {/* Summary Narrative Text paragraph */}
                  <div className="bg-slate-50/75 p-4 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-teal-600" />
                      <span>基本概念及理財功用</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-light text-justify">
                      {activeCategory.detailedDescription}
                    </p>
                  </div>

                  {/* 3 Grid layout: Key concepts, purchase guide, claim criteria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    
                    {/* Key Concepts List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-4 bg-teal-600 rounded" />
                        <h4 className="text-xs uppercase tracking-widest text-[#475569] font-bold">核心認知與產品特點</h4>
                      </div>
                      <div className="space-y-2.5">
                        {activeCategory.keyConcepts.map((item, id) => (
                          <div key={id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex gap-2">
                            <span className="text-teal-600 font-bold text-xs shrink-0">▪</span>
                            <p className="text-xs text-slate-600 leading-relaxed font-light">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Purchase tips & exclusions */}
                    <div className="space-y-4">
                      
                      {/* Tips for buying */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-4 bg-teal-600 rounded" />
                          <h4 className="text-xs uppercase tracking-widest text-[#475569] font-bold">錢家投保前錦囊</h4>
                        </div>
                        <ul className="space-y-2 list-none">
                          {activeCategory.purchaseTips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="font-light">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Claims checklist */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-4 bg-amber-500 rounded" />
                          <h4 className="text-xs uppercase tracking-widest text-[#475569] font-bold">關鍵索償須知</h4>
                        </div>
                        <ul className="space-y-2 list-none">
                          {activeCategory.claimTips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                              <span className="font-light">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  </div>

                  {/* Absolute Important Legal rules accordion/card */}
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2.5">
                    <h5 className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>投保前必須知曉的法律常識 (兩大基石)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {activeCategory.mustKnows.map((rule, idx) => (
                        <div key={idx} className="text-xs text-amber-900 border-l border-amber-200 pl-3 space-y-1">
                          <p className="font-light leading-relaxed text-justify">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Additional General香港保險 FAQ section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5 w-5 text-teal-600" />
                    <h3 className="font-sans font-extrabold text-slate-800 text-base tracking-tight">常見保險理財問答集 (FAQ)</h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {GENERAL_FAQS.map((faq, index) => {
                      const isOpen = activeFaqIndex === index;
                      return (
                        <div key={index} className="py-3">
                          <button
                            onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                            className="w-full flex items-center justify-between text-left font-bold text-slate-800 hover:text-teal-700 text-xs sm:text-sm py-2"
                          >
                            <span>{index + 1}. {faq.q}</span>
                            <ChevronDown className={`h-4 w-4 text-slate-400 transform transition-transform duration-200 ${isOpen ? "rotate-180 text-teal-600" : ""}`} />
                          </button>
                          
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light pl-4 py-2 text-justify border-l-2 border-slate-100 mt-1">
                                  {faq.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: Needs Assessment & Gap Calculator (保障缺口估算) */}
          {activeTab === "calculator" && (
            <motion.div
              key="calculator_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Interactive Form Inputs (5 cols wide on lg) */}
              <div className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="h-5 w-5 text-teal-600 shrink-0" />
                    <div>
                      <h2 className="font-sans font-extrabold text-slate-800 text-base sm:text-lg tracking-tight">保障缺口智能計算機</h2>
                      <p className="text-xs text-slate-500 font-light mt-0.5">輸入您的基本財務數據，估算人壽及健康險的保障落差。</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    
                    {/* Age and Income */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-bold uppercase text-[#475569]">您的壽命年齡 (歲)</label>
                        <input
                          type="number"
                          value={calculatorInput.age}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, age: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-slate-50 text-slate-900 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-bold uppercase text-[#475569]">個人每月收入 (HK$)</label>
                        <input
                          type="number"
                          step="1000"
                          value={calculatorInput.monthlyIncome}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, monthlyIncome: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-slate-50 text-slate-900 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                        />
                      </div>
                    </div>

                    {/* Dependents and Expenses */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-bold uppercase text-[#475569]">需要扶養人（受養親屬數）</label>
                        <input
                          type="number"
                          value={calculatorInput.dependents}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, dependents: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-slate-50 text-slate-900 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                        />
                        <p className="text-[10px] text-slate-400">如父母、在學子女等</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-bold uppercase text-[#475569]">每月家庭必要支付開支 (HK$)</label>
                        <input
                          type="number"
                          value={calculatorInput.monthlyExpenses}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, monthlyExpenses: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-slate-50 text-slate-900 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                        />
                        <p className="text-[10px] text-slate-400">伙食、租金及日常雜費</p>
                      </div>
                    </div>

                    {/* Debts and Mortgages */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono font-bold uppercase text-[#475569] block">目前房屋按揭或未清個人負債餘額 (HK$)</label>
                      <input
                        type="number"
                        step="10000"
                        value={calculatorInput.mortgageDebt}
                        onChange={(e) => setCalculatorInput({ ...calculatorInput, mortgageDebt: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full bg-slate-50 text-slate-900 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    {/* Checkbox settings */}
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3.5">
                      
                      {/* Current life assured */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-bold uppercase text-slate-600 block">現有人壽保險保額總和 (HK$)</label>
                        <input
                          type="number"
                          step="10000"
                          value={calculatorInput.currentLifeCoverage}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, currentLifeCoverage: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-full bg-white text-slate-900 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      {/* Current medical level */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono font-bold uppercase text-slate-600 block">現有醫療險保障水平</label>
                        <select
                          value={calculatorInput.currentMedicalCoverage}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, currentMedicalCoverage: e.target.value })}
                          className="w-full bg-white text-slate-900 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600 font-sans"
                        >
                          <option value="None">無任何醫療保險保障</option>
                          <option value="Basic">僅有僱主基本團體醫保</option>
                          <option value="Comprehensive">自行投保了全面的個人自願醫保 VHIS</option>
                        </select>
                      </div>

                      {/* Has critical illnesses */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="has_ci"
                          checked={calculatorInput.hasCriticalIllness}
                          onChange={(e) => setCalculatorInput({ ...calculatorInput, hasCriticalIllness: e.target.checked })}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4.5 w-4.5"
                        />
                        <label htmlFor="has_ci" className="text-xs font-bold text-slate-700 cursor-pointer">
                          我已有投保危疾保險（定額給付型）
                        </label>
                      </div>

                    </div>

                  </div>
                </div>

                {/* Calculate Actions button */}
                <div className="pt-6 border-t border-slate-100 mt-6 shrink-0">
                  <button
                    onClick={handleCalculateGap}
                    disabled={loadingAnalysis}
                    className="w-full py-4.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loadingAnalysis ? (
                      <>
                        <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                        <span>AI 理財顧問分析數據中...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 text-amber-300 animate-pulse" />
                        <span>💡 計算我的保險保障缺口</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-2 font-light">
                    *本工具估算公式依循香港理財教育專家指引。AI 決策依託 Google Gemini 技術。
                  </p>
                </div>
              </div>

              {/* Right Column: AI Analysis Result Display (7 cols wide on lg) */}
              <div className="lg:col-span-12 xl:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center min-h-[400px]">
                
                {/* 1. Prompt state before calculation is initiated */}
                {!analysisResult && !loadingAnalysis && !analysisError && (
                  <div className="py-12 text-center max-w-lg mx-auto space-y-4">
                    <div className="p-4 bg-teal-50 rounded-full inline-flex text-teal-600 border border-teal-100">
                      <Calculator className="h-10 w-10 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-sans font-bold text-slate-800 text-base">暫未評估理財缺口</h4>
                      <p className="text-xs text-slate-500 font-light leading-relaxed mt-2.5">
                        請在左側面板核實您的每月家庭必要支出、按揭貸款額度、親屬扶養情況等真實數據，點擊【計算我的保險保障缺口】，即可一鍵生成由 Gemini AI 精準出具的<strong>《香港市民精明保障評估報告》</strong>。
                      </p>
                    </div>

                    <div className="pt-4 grid grid-cols-2 gap-3 text-left">
                      <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2 border border-slate-100">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                        <span className="text-[11px] text-slate-600 font-light">科學壽險需求估計（開支扶養年限補齊）</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2 border border-slate-100">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                        <span className="text-[11px] text-slate-600 font-light">醫療自願醫保配置合理度審查</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Loading state */}
                {loadingAnalysis && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center max-w-sm mx-auto">
                    <div className="relative">
                      <div className="animate-ping h-12 w-12 bg-teal-200 rounded-full absolute" />
                      <RefreshCw className="h-10 w-10 text-teal-600 animate-spin relative" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-sm">正在調度 AI 理財規劃顧問...</p>
                      <p className="text-xs text-slate-500 font-light leading-relaxed">
                        正在參考錢家有道（IFEC）及香港保險行業標準核算模型。正為您生成人壽、危疾缺口及優先投保順序，請稍候。
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Error state */}
                {analysisError && (
                  <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-900 space-y-3">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                      <span>未開啟 AI 分析功能</span>
                    </div>
                    <p className="text-xs leading-relaxed text-red-700">
                      {analysisError}
                    </p>
                    <div className="p-3.5 bg-white rounded-xl text-xs text-slate-600 font-light border border-slate-200 leading-relaxed">
                      💡 <strong>簡易本地理財指引：</strong><br />
                      • <strong>人壽保額建議：</strong> 您有 {calculatorInput.dependents} 名受養親屬，每月必要支出 HK${calculatorInput.monthlyExpenses}。建議至少預備 10 年家庭所需及覆蓋按揭，即最低人壽保額為：<strong className="text-teal-700">HK${calculatorInput.monthlyExpenses * 12 * 10 + calculatorInput.mortgageDebt - calculatorInput.currentLifeCoverage}</strong>（現已人壽保額已扣減）。<br />
                      • <strong>醫療評估：</strong> 您的醫療級別為「{calculatorInput.currentMedicalCoverage === "None" ? "無" : calculatorInput.currentMedicalCoverage === "Basic" ? "僅公司醫保" : "已有自願醫保"}」。{calculatorInput.currentMedicalCoverage !== "Comprehensive" && "強烈建議加購自願醫保計劃靈活計劃，保障保證續保權益！"}
                    </div>
                  </div>
                )}

                {/* 4. Complete successful report rendering */}
                {analysisResult && !loadingAnalysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    
                    {/* Header Banner */}
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border-l-4 border-teal-600 flex items-start gap-3">
                      <ShieldCheck className="h-6 w-6 text-teal-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-mono font-bold text-teal-700 uppercase tracking-widest block">保障大師診斷認證</span>
                        <h3 className="font-sans font-extrabold text-[#0f172a] text-sm sm:text-base mt-0.5">
                          專屬《保障缺口分析與優化意見書》
                        </h3>
                      </div>
                    </div>

                    {/* Overall Evaluation */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs uppercase tracking-widest text-[#475569] font-bold block flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                        <span>基本財務及風險總結</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-justify font-light">
                        {analysisResult.evaluation}
                      </p>
                    </div>

                    {/* Risk alerts grid */}
                    <div className="space-y-2 pt-1">
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">潛在保障漏洞警報</span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {analysisResult.gapsRisk?.map((risk, index) => (
                          <div key={index} className="flex gap-2.5 items-start p-3 bg-rose-50 border border-rose-100 rounded-xl transition-all duration-300">
                            <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-950 font-normal leading-relaxed">{risk}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dynamic customized product recommendations */}
                    <div className="space-y-3 pt-1">
                      <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">理財專家優先配置藍圖</span>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {analysisResult.productSuggestions?.map((item, id) => (
                          <div key={id} className="p-4 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                            <div className="flex gap-2 items-center shrink-0">
                              <span className={`px-2.5 py-1 text-[10px] rounded-lg font-mono font-extrabold ${
                                item.priority === "HIGH" 
                                  ? "bg-rose-100 text-rose-800"
                                  : item.priority === "MEDIUM"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-200 text-slate-800"
                              }`}>
                                {item.priority === "HIGH" ? "極高優先" : item.priority === "MEDIUM" ? "中等建議" : "低先"}
                              </span>
                              <strong className="text-xs text-slate-800 font-sans">{item.type}</strong>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-light flex-1">
                              {item.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Educational takeaway quote */}
                    <div className="p-4 bg-teal-50 rounded-xl text-teal-950 text-xs font-medium border border-teal-100 italic flex items-center gap-2">
                      <Info className="h-4 w-4 text-teal-600 shrink-0" />
                      <span>錢家提醒你："{analysisResult.educationalTakeaway}"</span>
                    </div>

                  </motion.div>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 3: Interactive Dialogue Chatbot (AI 專家諮詢) */}
          {activeTab === "expert" && (
            <motion.div
              key="expert_tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[750px] lg:max-h-none h-[calc(100vh-280px)]"
            >
              {/* Left sidebar: Preset questions coordinates (4 cols wide on lg) */}
              <div className="lg:col-span-4 flex flex-col gap-3 h-full overflow-y-auto pr-1">
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
                  <div>
                    <span className="text-[9px] font-mono font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded uppercase">科普預設方案</span>
                    <h3 className="font-sans font-bold text-slate-800 text-sm mt-1.5">便捷保險專題快捷諮詢</h3>
                    <p className="text-xs text-slate-500 font-light leading-relaxed mt-1">
                      香港買保險的核心疑惑，點擊下方快捷預載方案，免去輸入苦功，與 AI 主題專家即刻對話：
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    {PRESET_QUERIES.map((preset) => (
                      <button
                        key={preset.title}
                        onClick={() => {
                          setQuickQuestionTriggered(true);
                          handleSendChatMessage(undefined, preset.query);
                          showToast(`已向專家發送諮詢：${preset.title}`);
                        }}
                        className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-teal-300 border border-slate-200 transition-all text-xs"
                      >
                        <div className="font-bold text-teal-800 flex items-center justify-between mb-1">
                          <span>{preset.title}</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-light">
                          {preset.query}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* General reminder box */}
                  <div className="p-3.5 bg-yellow-50 rounded-xl text-yellow-900 border border-yellow-100 text-xs font-light">
                    ⚠️ <strong>中立免責聲明：</strong> 錢家保險智囊為香港財務教育普及工具。AI 保險專家旨在解讀大眾保單條約與投保避坑指南，絕不向您推薦或代銷特定商業實體之保單產品。
                  </div>
                </div>
              </div>

              {/* Right column: Conversational Chat Interface (8 cols wide on lg) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                
                {/* Chat window Header Info */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div className="h-9 w-9 bg-teal-600 rounded-xl text-white flex items-center justify-center font-bold">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <span>錢家 AI 保險教育專家</span>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Active Agent Core: @google/genai & gemini-3.5-flash
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMessages([
                        {
                          id: "welcome",
                          role: "assistant",
                          content: "對話紀錄已全部重設。我是您的保險理財通專員，請隨便提問與保險有關的權益、冷靜期、保額核減、以及自願醫保 VHIS 好處！",
                          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        }
                      ]);
                      showToast("對話紀錄已清洗。");
                    }}
                    className="p-1 px-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 transition-all font-mono text-[10px] rounded-md font-bold text-center"
                    title="Clear Conversation Logs"
                  >
                    重設對話
                  </button>
                </div>

                {/* Conversation display body scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] h-[450px]">
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        {/* Avatar */}
                        {!isUser && (
                          <div className="h-8 w-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 font-extrabold text-xs">
                            💡
                          </div>
                        )}
                        {isUser && (
                          <div className="h-8 w-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-800 shrink-0 font-extrabold text-xs font-mono">
                            ME
                          </div>
                        )}

                        <div className="space-y-1">
                          {/* Chat Bubble contents */}
                          <div className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed text-left whitespace-pre-wrap ${
                            isUser 
                              ? "bg-teal-600 text-white rounded-tr-none" 
                              : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                          }`}>
                            {m.content}
                          </div>

                          {/* Timestamp and entity flags */}
                          <div className={`text-[10px] text-slate-400 font-mono ${isUser ? "text-right" : "text-left"}`}>
                            {m.timestamp}
                          </div>
                        </div>

                      </div>
                    );
                  })}

                  {/* Loading chatbot response state animation block */}
                  {loadingChat && (
                    <div className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="h-8 w-8 rounded-lg bg-teal-100 text-teal-700 animate-pulse flex items-center justify-center font-extrabold text-xs shrink-0">
                        💬
                      </div>
                      <div className="space-y-1">
                        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 text-xs flex items-center gap-2 rounded-tl-none">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
                          <span>理財專家正在構思中立、客觀的回答，請先放鬆...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Question Input form base panel */}
                <form 
                  onSubmit={(e) => handleSendChatMessage(e)}
                  className="p-4 border-t border-slate-200 bg-slate-50 flex gap-2 shrink-0"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="例如：自願醫保扣稅多少？冷靜期之內保單作廢怎樣退錢？開支很大應否買儲蓄險？"
                    className="flex-1 bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    disabled={loadingChat}
                  />

                  <button
                    type="submit"
                    disabled={loadingChat || !chatInput.trim()}
                    className="px-5 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all transition-colors shadow-sm"
                  >
                    <span>發送諮詢</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* Footer Credentials */}
      <footer id="app_footer" className="bg-[#1e293b] text-slate-300 border-t border-slate-700 py-6 px-6 mt-12 text-center text-xs">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="font-bold">
            💡 錢家保險智囊 / IFEC 保險理財教育與智能助理
          </p>
          <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto font-light">
            本應用旨在為公眾提供客觀的中立保險及個人理財教育，模型及分析完全基於香港「投資者及理財教育委員會（錢家有道）」的理念。所有財務指標與估算結果均使用 AI 模型生成，僅供學習與參考，並不構成任何具體的受監管投資、投保推薦、承保或索償承諾。
          </p>
          <div className="flex justify-center gap-4 text-slate-400 pt-2 font-mono">
            <span>© 2026 IFEC Insurance Scout Portal</span>
            <span>•</span>
            <span>Version 2.0 (Powered by Gemini)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
