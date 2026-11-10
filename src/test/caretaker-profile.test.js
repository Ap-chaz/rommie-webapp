import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getCaretakerProfile, submitVerification, login, logout } from "@/services/api";

describe("Caretaker profile API & backend integration", () => {
  beforeEach(async () => {
    await logout();
    window.localStorage.clear();
  });

  afterEach(async () => {
    await logout();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("fetches profile for backend-persisted caretaker (c-muthoni) via API", async () => {
    const mockMuthoniData = {
      caretaker: {
        id: "c-muthoni",
        name: "Faith Muthoni",
        phone: "+254712345670",
        email: "muthoni@example.com",
        isVerified: true,
        verified: true,
        joinedAt: new Date(Date.now() - 90 * 86400000).toISOString()
      },
      rooms: [
        {
          id: "r-ksl-bedsitter-1",
          title: "Sunny Modern Bedsitter near KSL Gate 2",
          rentKes: 8500,
          roomType: "bedsitter",
          area: "Karen",
          status: "Vacant",
          caretakerId: "c-muthoni",
          photos: ["https://cdn.rommie.co.ke/rooms/photo1.webp"]
        }
      ],
      trust: {
        score: 85,
        items: [
          { key: "verification", label: "Verification", points: 35, max: 35, note: "ID checked" },
          { key: "freshness", label: "Listing freshness", points: 30, max: 30, note: "Fresh" },
          { key: "reports", label: "Reports", points: 25, max: 25, note: "No reports" },
          { key: "age", label: "Account age", points: 3, max: 10, note: "3 months" }
        ]
      },
      verification: {
        status: "approved",
        request: null
      }
    };

    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && url.includes("/api/v1/caretakers/c-muthoni")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: mockMuthoniData })
        });
      }
      return originalFetch ? originalFetch(url) : Promise.reject(new Error("Network error"));
    });

    const profile = await getCaretakerProfile("c-muthoni");
    expect(profile).toBeDefined();
    expect(profile.caretaker.id).toBe("c-muthoni");
    expect(profile.caretaker.name).toBe("Faith Muthoni");
    expect(profile.caretaker.verified).toBe(true);
    expect(profile.caretaker.trustScore).toBe(85);
    expect(profile.rooms.length).toBe(1);
    expect(profile.rooms[0].id).toBe("r-ksl-bedsitter-1");
    expect(profile.trust.score).toBe(85);
    expect(profile.verification.status).toBe("approved");

    window.fetch = originalFetch;
  });

  it("fetches own profile without ID parameter when logged in as caretaker", async () => {
    // Log in as caretaker c1
    await login({ phone: "+254712345678", password: "password123" });

    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === "string" && (url.includes("/api/v1/caretakers/profile") || url.includes("/api/v1/caretakers/c1"))) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: {
              caretaker: {
                id: "c1",
                name: "Mama Wanjiru",
                phone: "+254712345678",
                verified: true
              },
              rooms: [],
              trust: { score: 70, items: [] },
              verification: { status: "approved" }
            }
          })
        });
      }
      return originalFetch ? originalFetch(url) : Promise.reject(new Error("Network error"));
    });

    const profile = await getCaretakerProfile();
    expect(profile).toBeDefined();
    expect(profile.caretaker.id).toBe("c1");
    expect(profile.caretaker.name).toBe("Mama Wanjiru");
    expect(profile.trust.score).toBe(70);

    window.fetch = originalFetch;
  });

  it("falls back cleanly to mock data when offline or network fails for seeded caretakers", async () => {
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    // c1 is a seeded caretaker in mockData
    const profile = await getCaretakerProfile("c1");
    expect(profile).toBeDefined();
    expect(profile.caretaker.id).toBe("c1");
    expect(profile.caretaker.name).toBe("Mama Wanjiru");
    expect(profile.trust.score).toBeGreaterThan(0);
    expect(profile.verification.status).toBe("approved");

    // Non-existent caretaker rejects with error
    await expect(getCaretakerProfile("c-unknown-999")).rejects.toThrow("Caretaker not found.");

    window.fetch = originalFetch;
  });

  it("submits caretaker verification and sends document details to backend", async () => {
    await login({ phone: "+254712345678", password: "password123" });

    const mockFile = new File(["dummy content"], "national-id.png", { type: "image/png" });

    let sentPayload = null;
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockImplementation((url, opts) => {
      if (typeof url === "string" && url.includes("/api/v1/media/upload")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ url: "https://cdn.rommie.co.ke/documents/national-id.png" })
        });
      }
      if (typeof url === "string" && url.includes("/api/v1/verification/caretaker")) {
        sentPayload = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            data: {
              id: "ver-1234",
              userId: "c1",
              documentUrl: sentPayload.documentUrl,
              documentName: sentPayload.documentName,
              status: "pending"
            }
          })
        });
      }
      return originalFetch ? originalFetch(url, opts) : Promise.reject(new Error("Network error"));
    });

    const res = await submitVerification("caretaker", mockFile);
    expect(res).toBeDefined();
    expect(res.status).toBe("pending");
    expect(sentPayload).toBeDefined();
    expect(sentPayload.documentName).toBe("national-id.png");
    expect(sentPayload.documentUrl).toContain("national-id.png");

    window.fetch = originalFetch;
  });
});
