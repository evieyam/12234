import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Parser from "rss-parser";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize parser
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["dc:creator", "creator"],
    ],
  },
});

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
 * Fetch and parse standard SCMP RSS Feed
 */
app.get("/api/feed", async (req, res) => {
  try {
    const feedUrl = "https://www.scmp.com/rss/2/feed/";
    const feed = await parser.parseURL(feedUrl);

    const items = feed.items.map((item: any) => {
      // Robust Image extraction
      let imageUrl = "";

      // 1. Check mediaContent array (rss-parser custom field)
      if (item.mediaContent && item.mediaContent.length > 0) {
        imageUrl = item.mediaContent[0]?.$?.url || "";
      }

      // 2. Check mediaThumbnail
      if (!imageUrl && item.mediaThumbnail) {
        imageUrl = item.mediaThumbnail?.$?.url || "";
      }

      // 3. Check standard enclosure
      if (!imageUrl && item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
      }

      // 4. Fallback search inside description HTML for <img> source
      const descHtml = item.description || item.content || "";
      if (!imageUrl && descHtml) {
        const imgElMatch = descHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgElMatch && imgElMatch[1]) {
          imageUrl = imgElMatch[1];
        }
      }

      // Clean HTML tags from description for card snippet representation
      let cleanDescription = descHtml
        .replace(/<[^>]*>/g, "") // Strip HTML tags
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();

      // If it's too long, truncate clean summary
      if (cleanDescription.length > 280) {
        cleanDescription = cleanDescription.slice(0, 277) + "...";
      }

      return {
        id: item.guid || item.link || Math.random().toString(),
        title: item.title?.replace(/&quot;/g, '"')?.replace(/&amp;/g, '&') || "Untitled Article",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        author: item.creator || item.author || "SCMP Reporter",
        description: cleanDescription,
        rawDescription: descHtml,
        imageUrl: imageUrl,
        categories: item.categories || [],
      };
    });

    res.json({
      title: feed.title || "South China Morning Post",
      link: feed.link || "https://www.scmp.com",
      description: feed.description || "World News Feed",
      items: items,
    });
  } catch (error: any) {
    console.error("Error parsing RSS feed:", error);
    res.status(500).json({
      error: "Failed to load RSS feed. Make sure the server can reach SCMP.",
      details: error.message,
    });
  }
});

/**
 * Generate AI Summary & Actionable Insights for a specific article
 */
app.post("/api/summary", async (req, res) => {
  const { title, description, link } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Article title is required" });
  }

  try {
    const ai = getGeminiClient();

    const prompt = `
You are an expert editorial analyst specializing in Asian development and geopolitics.
Analyze this article from the South China Morning Post (SCMP):

Title: ${title}
Snippet/Description: ${description}
Article Link: ${link}

Formulate a beautifully structured analysis in strict JSON format. Ensure all strings are correctly closed and formatted for parsing.
The response object must match this schema exactly:
{
  "summary": "A 3-sentence, high-level narrative summary of what is happening and why.",
  "takeaways": [
    "High-impact key insight bullet 1",
    "High-impact key insight bullet 2",
    "High-impact key insight bullet 3"
  ],
  "regionalContext": "A brief paragraph detailing the historical regional background, implications for East Asia (China, Hong Kong, surrounding states), or implications for global relations (e.g., US-China geopolitics). Give objective editorial depth as expected of top analysts.",
  "entities": ["Mentioned entity 1", "Mentioned entity 2", "Mentioned entity 3"]
}

Return ONLY standard raw JSON. Do not include markdown codeblocks or quotes around the response. Only the pure JSON string.
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
    console.error("Gemini summary error:", error);
    if (error.message && error.message.includes("GEMINI_API_KEY")) {
      return res.status(401).json({
        error: "Missing API Key",
        details: "Please configure your GEMINI_API_KEY secret in the AI Studio environment settings.",
      });
    }
    res.status(500).json({
      error: "Failed to generate AI insights.",
      details: error.message,
    });
  }
});

/**
 * Generate the Daily AI Context Brief (aggregated overview of top stories)
 */
app.post("/api/briefing", async (req, res) => {
  const { articles } = req.body;

  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return res.status(400).json({ error: "List of articles is required for briefing" });
  }

  try {
    const ai = getGeminiClient();

    const articlesText = articles
      .slice(0, 6)
      .map((a, i) => `${i + 1}. [${a.author || "SCMP"}] ${a.title}\nSnippet: ${a.description}`)
      .join("\n\n");

    const prompt = `
You are a senior geopolitical desk editor.
Synthesize these latest news flashes/articles from the South China Morning Post into an elegant, high-altitude briefing block.

Top Stories Context:
${articlesText}

Write a newsletter briefing in strict JSON format matching this schema:
{
  "headline": "A catchy, unified macro headline describing today's narrative pulse.",
  "narrativeBrief": "A beautifully written, cohesive daily editorial summary paragraph (4-5 sentences) that connects these stories, highlighting central economic, societal, or diplomatic themes.",
  "macroInsights": [
    "Macro theme/implication 1",
    "Macro theme/implication 2",
    "Macro theme/implication 3"
  ],
  "outlook": "A short sentence outlining what observers/investors should watch closely in the coming days."
}

Return ONLY standard raw JSON. No markdown backticks, code blocks, or preamble. Just valid JSON.
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
    console.error("Gemini briefing error:", error);
    if (error.message && error.message.includes("GEMINI_API_KEY")) {
      return res.status(401).json({
        error: "Missing API Key",
        details: "Please configure your GEMINI_API_KEY secret in the AI Studio environment settings.",
      });
    }
    res.status(500).json({
      error: "Failed to generate AI briefing.",
      details: error.message,
    });
  }
});

/**
 * Chat with Gemini about the selected article
 */
app.post("/api/chat", async (req, res) => {
  const { messages, article } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  try {
    const ai = getGeminiClient();

    // Prepare system instruction injection containing details about the target article
    const articleContext = article
      ? `You are discussing this specific article from the South China Morning Post (SCMP):
         Title: "${article.title}"
         Byline: "${article.author}"
         Published: "${article.pubDate}"
         Snippet: "${article.description}"
         URL: "${article.link}"
         
         Provide rich contextual explanations, historical milestones, and balanced geopolitical insights. Stick strictly to facts surrounding East Asia, Hong Kong affairs, and Global affairs related to the article.`
      : "You are an expert desk analyzer on East Asian affairs and general global news for the South China Morning Post (SCMP).";

    // Format chat history for @google/genai SDK
    // @google/genai chats.create handles conversational flow
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: articleContext,
      },
    });

    // Send previous messages to build up context
    // The last message is the current user prompt
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    
    // We can fetch response by sending user message
    // If there is preceding history, we can simulate or pass it.
    // For single turn chat inside of SCMP context, we can just feed a compiled prompt or utilize chat.sendMessage.
    const response = await chat.sendMessage({
      message: lastUserMessage,
    });

    res.json({
      content: response.text || "I was unable to formulate a response.",
    });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    if (error.message && error.message.includes("GEMINI_API_KEY")) {
      return res.status(401).json({
        error: "Missing API Key",
        details: "Please configure your GEMINI_API_KEY secret in the AI Studio environment settings to chat.",
      });
    }
    res.status(500).json({
      error: "AI dialogue failed.",
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
