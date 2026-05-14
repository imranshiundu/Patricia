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

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const text = await response.text();
  if (!response.ok) throw new Error(`LLM request failed (${response.status}): ${text.slice(0, 1200)}`);
  return text ? JSON.parse(text) : {};
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
    temperature: args.options.temperature ?? 0.05,
    max_tokens: args.options.maxTokens ?? 2400,
    ...(args.options.jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  return {
    content: data.choices?.[0]?.message?.content || "",
    provider: args.provider,
    model: args.model,
  } satisfies PatriciaLLMResult;
}

async function callAnthropic(messages: PatriciaLLMMessage[], options: PatriciaLLMOptions) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY for LEGAL_LLM_PROVIDER=anthropic.");
  const model = options.model || process.env.ANTHROPIC_MODEL || process.env.LEGAL_LLM_MODEL || "claude-sonnet-4-5";
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
  const model = options.model || process.env.GEMINI_MODEL || process.env.LEGAL_LLM_MODEL || "gemini-2.5-pro";
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
  const model = options.model || process.env.OLLAMA_MODEL || process.env.LEGAL_LLM_MODEL || "llama3.1";
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
    return callOpenAICompatible({ provider: "openai", baseUrl: "https://api.openai.com/v1", apiKey: process.env.OPENAI_API_KEY, model: options.model || process.env.OPENAI_MODEL || process.env.LEGAL_LLM_MODEL || "gpt-5.1", messages, options });
  }

  if (provider === "groq") {
    if (!process.env.GROQ_API_KEY) throw new Error("Missing GROQ_API_KEY for LEGAL_LLM_PROVIDER=groq.");
    return callOpenAICompatible({ provider: "groq", baseUrl: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY, model: options.model || process.env.GROQ_MODEL || process.env.LEGAL_LLM_MODEL || "llama-3.1-8b-instant", messages, options });
  }

  if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY for LEGAL_LLM_PROVIDER=openrouter.");
    return callOpenAICompatible({ provider: "openrouter", baseUrl: "https://openrouter.ai/api/v1", apiKey: process.env.OPENROUTER_API_KEY, model: options.model || process.env.OPENROUTER_MODEL || process.env.LEGAL_LLM_MODEL || "anthropic/claude-sonnet-4.5", messages, options });
  }

  if (provider === "openai-compatible" || provider === "custom") {
    if (!process.env.OPENAI_COMPATIBLE_BASE_URL) throw new Error("Missing OPENAI_COMPATIBLE_BASE_URL for LEGAL_LLM_PROVIDER=openai-compatible.");
    return callOpenAICompatible({ provider: "openai-compatible", baseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL, apiKey: process.env.OPENAI_COMPATIBLE_API_KEY, model: options.model || process.env.OPENAI_COMPATIBLE_MODEL || process.env.LEGAL_LLM_MODEL || "model", messages, options });
  }

  throw new Error("No LLM provider configured. Set LEGAL_LLM_PROVIDER plus the matching API key, or set ANTHROPIC_API_KEY / OPENAI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY / GEMINI_API_KEY / OLLAMA_BASE_URL.");
}
