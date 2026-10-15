import { matchRoutes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { routes } from "@/routes";

// Match routes without rendering: pages are lazy-loaded, so this only checks the route table.
const lastMatch = (path) => matchRoutes(routes, path)?.at(-1);

describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const match = lastMatch("/");
    expect(match).toBeDefined();
    expect(match.route.index).toBe(true);
  });

  it("matches room detail URLs and captures the id", () => {
    const match = lastMatch("/rooms/r1");
    expect(match.route.path).toBe("rooms/:id");
    expect(match.params).toEqual({ id: "r1" });
  });

  it("falls back to the catch-all for unknown URLs", () => {
    expect(lastMatch("/definitely/not/a/page").route.path).toBe("*");
  });

  it.each([
    "/rooms", "/saved", "/alerts", "/verify-student", "/report", "/zones", "/safety-tips",
    "/for-caretakers", "/how-verification-works", "/privacy", "/terms", "/caretaker/profile",
    "/admin", "/admin/verification",
  ])("%s has a page", (p) => {
    expect(lastMatch(p)?.route.path).not.toBe("*");
  });
});
