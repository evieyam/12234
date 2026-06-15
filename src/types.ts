export interface Article {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  author: string;
  description: string;
  rawDescription: string;
  imageUrl: string;
  categories: string[];
}

export interface FeedResponse {
  title: string;
  link: string;
  description: string;
  items: Article[];
}

export interface AISummary {
  summary: string;
  takeaways: string[];
  regionalContext: string;
  entities: string[];
}

export interface DailyBrief {
  headline: string;
  narrativeBrief: string;
  macroInsights: string[];
  outlook: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
