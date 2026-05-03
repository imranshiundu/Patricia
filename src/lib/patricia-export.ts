import { PatriciaCaseRecord } from "@/lib/patricia-storage";

export function downloadTextFile(filename: string, content: string, mimeType = "text/plain;charset=utf-8") {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "patricia-case";
}

export function exportCaseAsMarkdown(caseRecord: PatriciaCaseRecord) {
  const content = [
    `# ${caseRecord.title}`,
    "",
    caseRecord.citation ? `**Citation / Source:** ${caseRecord.citation}` : "",
    caseRecord.area ? `**Area / Type:** ${caseRecord.area}` : "",
    `**Saved:** ${caseRecord.createdAt}`,
    "",
    "## Patricia verification note",
    "",
    "This export contains locally saved text. Always verify against the original judgment, statute, or official source before relying on it.",
    "",
    caseRecord.summary ? `## Summary\n\n${caseRecord.summary}\n` : "",
    "## Text",
    "",
    caseRecord.fullText || caseRecord.textPreview || "No text stored.",
  ].filter(Boolean).join("\n");

  downloadTextFile(`${safeFilename(caseRecord.title)}.md`, content, "text/markdown;charset=utf-8");
}

export function exportCasesJson(cases: PatriciaCaseRecord[]) {
  downloadTextFile(
    `patricia-library-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify({ exportedAt: new Date().toISOString(), cases }, null, 2),
    "application/json;charset=utf-8"
  );
}
