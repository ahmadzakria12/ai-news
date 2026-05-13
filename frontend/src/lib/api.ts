import axios, { AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

if (
  typeof window !== "undefined" &&
  window.location.hostname.includes("vercel.app") &&
  !process.env.NEXT_PUBLIC_API_URL
) {
  console.error(
    "NEXT_PUBLIC_API_URL is not set. Add it in Vercel → Environment Variables.",
    "Current API URL:",
    API_URL
  );
}

export interface AgentResponse {
  result: string;
  session_id: string;
  agent_type?: string;
}

export interface LiveNewsItem {
  title: string;
  summary: string;
  url: string;
  image_url?: string | null;
  source: string;
  time: string;
}

export interface LiveNewsResponse {
  result: string;
  items?: LiveNewsItem[];
  session_id: string;
  categories: string[];
  update_time: string;
  provider?: string;
}

export interface MultiAgentNewsResponse {
  results: Record<string, string>;
  session_id: string;
}

export interface UltimateNewsResponse {
  result: string;
  session_id: string;
  features: string[];
  language?: string;
  pdf_path?: string;
  voice_path?: string;
  voice_audio_language?: "en" | "ur";
  graph_path?: string;
  voice_error?: string;
}

function detailFromAxios(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: string }>;
    const d = ax.response?.data?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return JSON.stringify(d);
    return ax.message;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function runAgent(
  agentType: string,
  query: string,
  sessionId?: string
): Promise<AgentResponse> {
  try {
    const { data } = await api.post<AgentResponse>("/api/agent", {
      query,
      agent_type: agentType,
      session_id: sessionId,
    });
    return data;
  } catch (e) {
    throw new Error(detailFromAxios(e));
  }
}

export async function getMultiAgentNews(
  query: string,
  agents: string[],
  sessionId?: string
): Promise<MultiAgentNewsResponse> {
  try {
    const { data } = await api.post<MultiAgentNewsResponse>("/api/news", {
      query,
      agents,
      session_id: sessionId,
    });
    return data;
  } catch (e) {
    throw new Error(detailFromAxios(e));
  }
}

export async function getLiveNews(
  categories?: string[],
  sessionId?: string
): Promise<LiveNewsResponse> {
  try {
    const { data } = await api.post<LiveNewsResponse>("/api/live-news", {
      categories: categories?.length ? categories : ["all"],
      session_id: sessionId,
    });
    return data;
  } catch (e) {
    let msg = detailFromAxios(e);
    if (
      /Invalid OpenAI API key|Error running agent/i.test(msg) &&
      !/live_news.?rss/i.test(msg)
    ) {
      const base = API_URL.replace(/\/$/, "");
      msg += ` Live News does not use OpenAI (RSS + optional NewsAPI only). This error usually means the app is hitting an old backend. Stop all uvicorn/python on port 8000, restart from the backend folder, then open ${base}/health — you should see "live_news":"rss".`;
    }
    throw new Error(msg);
  }
}

export async function postUltimateNews(body: {
  query: string;
  features: string[];
  language: string;
  session_id?: string;
}): Promise<UltimateNewsResponse> {
  try {
    const { data } = await api.post<UltimateNewsResponse>(
      "/api/ultimate-news",
      body
    );
    return data;
  } catch (e) {
    throw new Error(detailFromAxios(e));
  }
}

export function assetUrl(kind: "pdf" | "audio" | "graph", filename: string) {
  const base = API_URL.replace(/\/$/, "");
  if (kind === "pdf") return `${base}/api/download-pdf/${encodeURIComponent(filename)}`;
  if (kind === "audio") return `${base}/api/download-audio/${encodeURIComponent(filename)}`;
  return `${base}/api/download-graph/${encodeURIComponent(filename)}`;
}
