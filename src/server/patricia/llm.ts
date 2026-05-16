import https from "https";
import http from "http";
import { URL } from "url";

export type PatriciaLLMRole = "system" | "user" | "assistant";

export type PatriciaLLMMessage = {
  role: PatriciaLLMRole;
  content: string;
};

export type PatriciaLLMResult = {
  content: string;
  provider: string;
  model: string;
};

export type PatriciaLLMOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
};

export type PatriciaLLMStatus = {
  configured: boolean;
  provider: string;
  model: string;
  serverOnly: true;
};

function compactMessages(messages: PatriciaLLMMessage[]) {
  return messages.filter((message) => message.content?.trim()).map((message) => ({ role: message.role, content: message.content }));
}

function systemText(messages: PatriciaLLMMessage[]) {
  return messages.filter((message) => message.role === "system").map((message) => message.content).join("\n\n");
}

function nonSystemMessages(messages: PatriciaLLMMessage[]) {
  return messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role, content: message.content }));
}

function selectedProvider() {
  const explicit = process.env.LEGAL_LLM_PROVIDER || process.env.PATRICIA_LLM_PROVIDER;
  if (explicit) return explicit.toLowerCase();
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "gemini";
  if (process.env.OLLAMA_BASE_URL) return "ollama";
  if (process.env.OPENAI_COMPATIBLE_BASE_URL) return "openai-compatible";
  return "none";
}

function selectedModel(provider: string) {
  if (provider === "anthropic" || provider === "claude") return process.env.ANTHROPIC_MODEL || process.env.LEGAL_LLM_MODEL || "claude-sonnet-4-5";
  if (provider === "openai") return process.env.OPENAI_MODEL || process.env.LEGAL_LLM_MODEL || "gpt-5.1";
  if (provider === "groq") return process.env.GROQ_MODEL || process.env.LEGAL_LLM_MODEL || "llama-3.1-8b-instant";
  if (provider === "openrouter") return process.env.OPENROUTER_MODEL || process.env.LEGAL_LLM_MODEL || "anthropic/claude-sonnet-4.5";
  if (provider === "gemini" || provider === "google") return process.env.GEMINI_MODEL || process.env.LEGAL_LLM_MODEL || "gemini-2.5-pro";
  if (provider === "ollama" || provider === "local") return process.env.OLLAMA_MODEL || process.env.LEGAL_LLM_MODEL || "llama3.1";
  if (provider === "openai-compatible" || provider === "custom") return process.env.OPENAI_COMPATIBLE_MODEL || process.env.LEGAL_LLM_MODEL || "model";
  return "not configured";
}

export function getPatriciaLLMStatus(): PatriciaLLMStatus {
  const provider = selectedProvider();
  return {
    configured: provider !== "none",
    provider,
    model: selectedModel(provider),
    serverOnly: true,
  };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<Record<string, unknown>> {
  const parsed = new URL(url);
  const payload = JSON.stringify(body);
  const isHttps = parsed.protocol === "https:";
  const lib = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(new Error(`LLM request failed (${res.statusCode}): ${data.slice(0, 1200)}`));
            return;
          }
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            reject(new Error(`LLM response parse error: ${data.slice(0, 400)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function callOpenAICompatible(args: {
  provider: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  messages: PatriciaLLMMessage[];
  options: PatriciaLLMOptions;
}) {
  const data = await postJson(`${args.baseUrl.replace(/\/$/, "")}/chat/completions`, args.apiKey ? { Authorization: `Bearer ${args.apiKey}` } : {}, {
    model: args.model,
    messages: compactMessages(args.messages),
    temperature: args.options.temperature ?? 0.1,
    max_tokens: args.options.maxTokens ?? 8192,
    ...(args.options.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return {
    content: (data.choices as Array<{message: {content: string}}>)?.[0]?.message?.content || "",
    provider: args.provider,
    model: args.model,
  } satisfies PatriciaLLMResult;
}

async function callAnthropic(messages: PatriciaLLMMessage[], options: PatriciaLLMOptions) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY for LEGAL_LLM_PROVIDER=anthropic.");
  const model = options.model || selectedModel("anthropic");
  const data = await postJson("https://api.anthropic.com/v1/messages", {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  }, {
    model,
    system: systemText(messages),
    messages: nonSystemMessages(messages),
    temperature: options.temperature ?? 0.05,
    max_tokens: options.maxTokens ?? 2400,
  });

  return {
    content: Array.isArray(data.content) ? data.content.map((item: { text?: string }) => item.text || "").join("\n") : "",
    provider: "anthropic",
    model,
  } satisfies PatriciaLLMResult;
}

async function callGemini(messages: PatriciaLLMMessage[], options: PatriciaLLMOptions) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY for LEGAL_LLM_PROVIDER=gemini.");
  const model = options.model || selectedModel("gemini");
  const data = await postJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {}, {
    system_instruction: { parts: [{ text: systemText(messages) }] },
    contents: nonSystemMessages(messages).map((message) => ({ role: message.role === "assistant" ? "model" : "user", parts: [{ text: message.content }] })),
    generationConfig: { temperature: options.temperature ?? 0.05, maxOutputTokens: options.maxTokens ?? 2400 },
  });

  return {
    content: data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("\n") || "",
    provider: "gemini",
    model,
  } satisfies PatriciaLLMResult;
}

async function callOllama(messages: PatriciaLLMMessage[], options: PatriciaLLMOptions) {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = options.model || selectedModel("ollama");
  const data = await postJson(`${baseUrl.replace(/\/$/, "")}/api/chat`, {}, {
    model,
    messages: compactMessages(messages),
    stream: false,
    options: { temperature: options.temperature ?? 0.05, num_predict: options.maxTokens ?? 2400 },
  });

  return {
    content: data.message?.content || "",
    provider: "ollama",
    model,
  } satisfies PatriciaLLMResult;
}

export async function callPatriciaLLM(messages: PatriciaLLMMessage[], options: PatriciaLLMOptions = {}): Promise<PatriciaLLMResult> {
  const provider = selectedProvider();
  if (provider === "anthropic" || provider === "claude") return callAnthropic(messages, options);
  if (provider === "gemini" || provider === "google") return callGemini(messages, options);
  if (provider === "ollama" || provider === "local") return callOllama(messages, options);

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY for LEGAL_LLM_PROVIDER=openai.");
    return callOpenAICompatible({ provider: "openai", baseUrl: "https://api.openai.com/v1", apiKey: process.env.OPENAI_API_KEY, model: options.model || selectedModel("openai"), messages, options });
  }

  if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY for LEGAL_LLM_PROVIDER=groq.");
    return callOpenAICompatible({ provider: "groq", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY, model: options.model || selectedModel("groq"), messages, options });
  }

  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY for LEGAL_LLM_PROVIDER=openrouter.");
    return callOpenAICompatible({ provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY, model: options.model || selectedModel("openrouter"), messages, options });
  }

  if (provider === "openai-compatible" || provider === "custom") {
    if (!process.env.OPENAI_COMPATIBLE_BASE_URL) throw new Error("Missing OPENAI_COMPATIBLE_BASE_URL for LEGAL_LLM_PROVIDER=openai-compatible.");
    return callOpenAICompatible({ provider: "openai-compatible", baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL, apiKey: process.env.OPENAI_COMPATIBLE_API_KEY, model: options.model || selectedModel("openai-compatible"), messages, options });
  }

  throw new Error("No server LLM provider configured. Set LEGAL_LLM_PROVIDER plus the matching server-side API key. Do not use NEXT_PUBLIC keys for legal LLM calls.");
}
