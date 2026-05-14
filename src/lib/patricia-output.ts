export function cleanVisibleAnswer(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^Sources returned[\s\S]*$/im, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
