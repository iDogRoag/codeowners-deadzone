export function plural(count: number, singular: string, pluralValue = `${singular}s`): string {
  return count === 1 ? singular : pluralValue;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function markdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
