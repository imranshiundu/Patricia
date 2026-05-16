import { PatriciaSkillCommand } from "./patricia-skills/types";
import fs from "fs";
import path from "path";

const BRAIN_ROOT = path.join(process.cwd(), "Brain");
const CACHE = new Map<string, string>();

function stripFrontmatter(markdown: string) {
  return markdown.replace(/^---[\s\S]*?---\s*/m, "").trim();
}

export function patriciaBrainSkillPath(command: PatriciaSkillCommand) {
  return command.sourcePath || `${command.plugin}/skills/${command.slug}/SKILL.md`;
}

export async function loadPatriciaBrainSkill(command: PatriciaSkillCommand) {
  const relativePath = patriciaBrainSkillPath(command);
  if (CACHE.has(relativePath)) return CACHE.get(relativePath) || "";
  
  try {
    const fullPath = path.join(BRAIN_ROOT, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    const content = stripFrontmatter(fs.readFileSync(fullPath, "utf-8"));
    CACHE.set(relativePath, content);
    return content;
  } catch (error) {
    const fallback = [
      `# ${command.command}`,
      `Brain resource missing at ${relativePath}.`,
      command.promptFrame
    ].join("\n\n");
    CACHE.set(relativePath, fallback);
    return fallback;
  }
}

export function buildPatriciaBrainRuntimePrompt(args: {
  command: PatriciaSkillCommand;
  skillMarkdown: string;
  practiceProfile?: string;
  documentTitle?: string;
  documentText?: string;
  userQuestion: string;
}) {
  const profile = args.practiceProfile?.trim() || "No practice profile configured yet. Use cautious intake mode and request missing playbook details.";
  return [
    "Run the workflow from the Patricia Brain source file.",
    "The loaded Patricia Brain resource controls the workflow.",
    "Patricia owns chat, documents, audio, storage, provider routing, and orchestration only.",
    "Do not claim external connectors ran unless connector output is provided.",
    "Every output is a draft for qualified review.",
    `COMMAND: ${args.command.command}`,
    `PLUGIN: ${args.command.plugin}`,
    `AGENT: ${args.command.agent}`,
    `SOURCE PATH: ${patriciaBrainSkillPath(args.command)}`,
    `DOCUMENT TITLE: ${args.documentTitle || "not provided"}`,
    "PRACTICE PROFILE:",
    profile,
    "PATRICIA BRAIN SOURCE:",
    args.skillMarkdown,
    "USER TASK:",
    args.userQuestion,
    args.documentText?.trim() ? `DOCUMENT / FACT SOURCE TEXT:\n${args.documentText.trim()}` : "DOCUMENT / FACT SOURCE TEXT: not provided",
  ].join("\n\n");
}
