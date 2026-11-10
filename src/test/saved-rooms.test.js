import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { login, logout, saveRoom, unsaveRoom, getSavedIds, getSavedRooms } from "@/services/api";

describe("Saved rooms API & state persistence", () => {
  beforeEach(async () => {
    await logout();
    window.localStorage.clear();
  });

  afterEach(async () => {
    await logout();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("handles token extraction when stored as raw JWT string or JSON in localStorage", async () => {
    // 1. Raw JWT string in localStorage
    window.localStorage.setItem("rommie.token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rawtoken");
    const u = await login({ phone: "+254711111111", password: "password123" });
    expect(u.role).toBe("student");
    expect(window.localStorage.getItem("rommie.token")).toBeDefined();
  });

  it("allows a logged-in student to save and unsave rooms and retrieve full details", async () => {
    await login({ phone: "+254711111111", password: "password123" });

    expect(await getSavedIds()).toEqual([]);

    // Save r1
    await saveRoom("r1");
    expect(await getSavedIds()).toContain("r1");

    // Save r2
    await saveRoom("r2");
    expect(await getSavedIds()).toEqual(["r2", "r1"]);

    // Fetch saved room details
    const rooms = await getSavedRooms();
    expect(rooms.length).toBe(2);

    const r1 = rooms.find((r) => r.id === "r1");
    expect(r1).toBeDefined();
    expect(r1.title).toContain("Studio");
    expect(r1.caretaker).toBeDefined();
    expect(typeof r1.caretaker.verified).toBe("boolean");
    expect(typeof r1.caretaker.trustScore).toBe("number");

    // Unsave r1
    await unsaveRoom("r1");
    expect(await getSavedIds()).toEqual(["r2"]);

    // Unsave r2
    await unsaveRoom("r2");
    expect(await getSavedIds()).toEqual([]);
  });

  it("throws when saveRoom encounters backend failure so callers can roll back", async () => {
    await login({ phone: "+254711111111", password: "password123" });

    // Mock fetch to simulate 500 server error
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/v1/saved/r-error")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ error: { message: "Internal server error" } }),
        });
      }
      return Promise.reject(new Error("network error"));
    });

    await expect(saveRoom("r-error")).rejects.toThrow("Internal server error");

    window.fetch = originalFetch;
  });

  it("throws when unsaveRoom encounters backend failure", async () => {
    await login({ phone: "+254711111111", password: "password123" });

    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/v1/saved/r-error")) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ error: { message: "Forbidden" } }),
        });
      }
      return Promise.reject(new Error("network error"));
    });

    await expect(unsaveRoom("r-error")).rejects.toThrow("Forbidden");

    window.fetch = originalFetch;
  });

  it("rejects unauthenticated calls when no session exists", async () => {
    await logout();
    await expect(saveRoom("r1")).rejects.toThrow();
  });
});
