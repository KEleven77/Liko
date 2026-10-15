import { expect, it } from "vitest";
import { parseNetworkHours } from "../networkRange";

it.each(["", " ", "0", "-1", "1.5", "NaN", "Infinity"])("rejects uncommittable hours: %s", (text) => {
  expect(parseNetworkHours(text)).toBeNull();
});

it("rejects a value above the default max of 168", () => {
  expect(parseNetworkHours("169")).toBeNull();
  expect(parseNetworkHours("169", 168)).toBeNull();
});

it("rejects a value above a custom max", () => {
  expect(parseNetworkHours("25", 24)).toBeNull();
});

it.each([1, 6, 12, 24, 168])("accepts a whole hour in range with default max: %s", (hours) => {
  expect(parseNetworkHours(String(hours))).toBe(hours);
});

it("accepts a whole hour within a custom retention window", () => {
  expect(parseNetworkHours("12", 48)).toBe(12);
  expect(parseNetworkHours("48", 48)).toBe(48);
  expect(parseNetworkHours("49", 48)).toBeNull();
});
