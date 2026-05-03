export type PatriciaChunk = {
  index: number;
  title: string;
  text: string;
  estimatedMinutes: number;
};

export function splitForGroq(text: string, maxChars = 9000): PatriciaChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).length > maxChars && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current) chunks.push(current.trim());

  return chunks.map((chunk, index) => ({
    index,
    title: chunks.length === 1 ? "Full judgment" : `Part ${index + 1} of ${chunks.length}`,
    text: chunk,
    estimatedMinutes: estimateNarrationMinutes(chunk),
  }));
}

export function estimateNarrationMinutes(text: string, wordsPerMinute = 145) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function extractCaseTitle(text: string) {
  const firstUsefulLine = text
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 8 && line.length < 180);

  return firstUsefulLine || "Untitled case";
}

export function makeCaseId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `case-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
