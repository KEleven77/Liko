const assignedHues = new Map<string, number>();

function hueDistance(left: number, right: number): number {
  const distance = Math.abs(left - right);
  return Math.min(distance, 360 - distance);
}

/** Share assignments across cards and avoid nearby hues while space permits. */
export function tagHue(label: string): number {
  const key = label.trim().normalize("NFC");
  const assigned = assignedHues.get(key);
  if (assigned !== undefined) return assigned;
  let hash = 2166136261;
  for (const character of key) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
  }
  const initial = ((hash >>> 0) % 360000) / 1000;
  let hue = initial;
  let bestDistance = -1;
  // Golden-angle candidates spread colors over the spectrum. Once crowded,
  // choose the most separated available candidate instead of reusing a color.
  for (let index = 0; index < 32; index++) {
    const candidate = (initial + index * 137.508) % 360;
    let distance = 180;
    for (const existing of assignedHues.values()) {
      distance = Math.min(distance, hueDistance(candidate, existing));
    }
    if (distance > bestDistance) {
      hue = candidate;
      bestDistance = distance;
    }
    if (distance >= 40) break;
  }
  assignedHues.set(key, hue);
  return hue;
}
