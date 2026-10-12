/** Stable text-derived hue; independent of node, tag order and supplied colors. */
export function tagHue(label: string): number {
  let hash = 2166136261;
  for (const character of label.trim().normalize("NFC")) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  return ((hash >>> 0) % 360000) / 1000;
}
