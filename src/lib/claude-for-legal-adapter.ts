import { PatriciaSkillCommand } from "./patricia-skills/types";

const RAW_BASE = "https://raw.githubusercontent.com/anthropics/claude-for-legal/main";
const CACHE = new Map<string, string>();

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\s*/m, "").trim();
}

export function claudeForLegalSkillPath(command: PatriciaSkillCommand) {
  return command.sourcePath || `${command.plugin}/skills/${command.slug}/SKILL.md`;
}

export async function loadClaudeForLegalSkill(command: PatriciaSkillCommand) {
  const path = claudeForLegalSkillPath(command);
  if (CACHE.has(path)) return CACHE.get(path) || "";
  const response = await fetch(`${RAW_BASE}/${path}`, { next: { revalidate: 3600 } });
  if (!response.ok) {
    const fallback = [`# ${command.command}`, `Source file missing at ${path}.`, command.promptFrame].join("\n\n");
    CACHE.set(path, fallback);
    return fallback;
  }
  const content = stripFrontmatter(await response.text());
  CACHE.set(path, content);
  return content;
}

export function buildClaudeForLegalRuntimePrompt(args: {
  command: PatriciaSkillCommand;
  skillMarkdown: string;
  practiceProfile?: string;
  documentTitle?: string;
  documentText?: string;
  userQuestion: string;
}) {
  const profile = args.practiceProfile?.trim() || "No practice profile configured yet. Use cautious intake mode and request missing playbook details.";
  return [
    "Run the workflow from the claude-for-legal source file inside Patricia.",
    "The loaded claude-for-legal source controls the workflow.",
    "Patricia owns chat, documents, audio, storage, provider routing, and orchestration only.",
    "Do not claim external connectors ran unless connector output is provided.",
    "Every output is a draft for qualified review.",
    `COMMAND: ${args.command.command}`,
    `PLUGIN: ${args.command.plugin}`,
    `AGENT: ${args.command.agent}`,
    `SOURCE PATH: ${claudeForLegalSkillPath(args.command)}`,
    `DOCUMENT TITLE: ${args.documentTitle || "not provided"}`,
    "PRACTICE PROFILE:",
    profile,
    "CLAUDE-FOR-LEGAL SOURCE:",
    args.skillMarkdown,
    "USER TASK:",
    args.userQuestion,
    args.documentText?.trim() ? `DOCUMENT / FACT SOURCE TEXT:\n${args.documentText.trim()}` : "DOCUMENT / FACT SOURCE TEXT: not provided",
  ].join("\n\n");
}
