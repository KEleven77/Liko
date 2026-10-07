import { expect, it } from "vitest";
import { parseNetworkHours } from "../NodeNetworkDialog";

it.each(["", " ", "0", "169", "-1", "1.5", "NaN", "Infinity"])("rejects uncommittable hours: %s", (text) => {
  expect(parseNetworkHours(text)).toBeNull();
});

it.each([1, 6, 12, 24, 168])("accepts a whole hour in range: %s", (hours) => {
  expect(parseNetworkHours(String(hours))).toBe(hours);
});
