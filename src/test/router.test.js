import { describe, expect, it } from "vitest";
import { buildTo, parseSearch, stringifySearch } from "@/lib/router";

describe("router helpers", () => {
  it("fills $params and URL-encodes them", () => {
    expect(buildTo("/rooms/$id", { id: "r 1" })).toBe("/rooms/r%201");
    expect(buildTo("/caretaker/edit/$id", { id: "r1" })).toBe("/caretaker/edit/r1");
  });

  it("skips undefined values and returns '' when nothing is left", () => {
    expect(stringifySearch({ area: undefined })).toBe("");
    expect(stringifySearch({})).toBe("");
    expect(stringifySearch(undefined)).toBe("");
  });

  it("round-trips strings, numbers, booleans and arrays", () => {
    const search = { area: "Maasai Lodge", maxRent: 6000, vacantOnly: false, amenities: ["WiFi", "Tokens"] };
    expect(parseSearch(stringifySearch(search))).toEqual(search);
  });

  it("keeps numeric-looking strings as strings", () => {
    expect(parseSearch(stringifySearch({ code: "123" }))).toEqual({ code: "123" });
  });

  it("round-trips a redirect path that has its own query string", () => {
    const redirect = "/rooms?area=Rongai&maxRent=6000";
    expect(parseSearch(stringifySearch({ redirect }))).toEqual({ redirect });
  });

  it("builds a link target with params and search together", () => {
    expect(buildTo("/rooms/$id", { id: "r1" }, { tab: "photos" })).toBe("/rooms/r1?tab=photos");
  });
});
