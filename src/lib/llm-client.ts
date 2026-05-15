type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  if (!res.ok) return { error: `Request failed: ${res.status} ${res.statusText}`, detail: await res.text(), status: res.status };
  const data = await res.json();
  return { data };
}

export async function callLlm(messages: GroqMessage[], options?: { model?: string; maxTokens?: number; jsonMode?: boolean }) {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const providerEnv = process.env.LLM_PROVIDER?.toLowerCase();

  // Select provider by explicit override then available keys
  const provider = providerEnv || (groqKey ? "groq" : openaiKey ? "openai" : anthropicKey ? "anthropic" : "none");

  if (provider === "none") return { error: "No LLM provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY." , status: 500 };

  if (provider === "groq") {
    if (!groqKey) return { error: "GROQ_API_KEY missing.", status: 500 };
    const url = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";
    const model = options?.model || process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const body: any = { model, messages, temperature: 0.05, max_tokens: options?.maxTokens ?? 2400 };
    if (options?.jsonMode) body.response_format = { type: "json_object" };
    const res = await postJson(url, body, { Authorization: `Bearer ${groqKey}` });
    if ("error" in res) return { error: res.error, detail: res.detail, status: res.status };
    return { content: res.data.choices?.[0]?.message?.content ?? "" };
  }

  if (provider === "openai") {
    if (!openaiKey) return { error: "OPENAI_API_KEY missing.", status: 500 };
    const url = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    const model = options?.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const body: any = { model, messages, temperature: 0.05, max_tokens: options?.maxTokens ?? 2400 };
    const res = await postJson(url, body, { Authorization: `Bearer ${openaiKey}` });
    if ("error" in res) return { error: res.error, detail: res.detail, status: res.status };
    return { content: res.data.choices?.[0]?.message?.content ?? "" };
  }

  if (provider === "anthropic") {
    if (!anthropicKey) return { error: "ANTHROPIC_API_KEY missing.", status: 500 };
    const url = process.env.ANTHROPIC_API_URL || "https://api.anthropic.com/v1/complete";
    const model = options?.model || process.env.ANTHROPIC_MODEL || "claude-2.1";
    // Anthropic expects a single prompt; convert messages into a prompt
    const prompt = messages.map((m) => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n");
    const body: any = { model, prompt, max_tokens_to_sample: options?.maxTokens ?? 2400, temperature: 0.05 };
    const res = await postJson(url, body, { Authorization: `Bearer ${anthropicKey}` });
    if ("error" in res) return { error: res.error, detail: res.detail, status: res.status };
    return { content: res.data?.completion ?? res.data?.choices?.[0]?.text ?? "" };
  }

  return { error: "Unsupported LLM provider selection.", status: 500 };
}

export function availableProviders() {
  return {
    groq: Boolean(process.env.GROQ_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
  };
}
