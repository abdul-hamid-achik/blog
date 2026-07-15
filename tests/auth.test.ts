import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  env: { SITE_OWNER_EMAIL: undefined as string | undefined },
  eq: vi.fn((left: unknown, right: unknown) => ({ left, right, op: "eq" })),
  and: vi.fn((...conditions: unknown[]) => ({ conditions, op: "and" })),
  gt: vi.fn((left: unknown, right: unknown) => ({ left, right, op: "gt" })),
  count: vi.fn(() => "count-expression"),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/env.mjs", () => ({ env: mocks.env }));
vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/db/schema", () => ({
  users: { id: "users.id", email: "users.email" },
  verificationTokens: {
    token: "verificationTokens.token",
    used: "verificationTokens.used",
    expiresAt: "verificationTokens.expiresAt",
    email: "verificationTokens.email",
  },
  chatMessages: {
    sessionId: "chatMessages.sessionId",
    role: "chatMessages.role",
  },
}));
vi.mock("drizzle-orm", () => ({
  eq: mocks.eq,
  and: mocks.and,
  gt: mocks.gt,
  count: mocks.count,
}));

import {
  createUser,
  createVerificationToken,
  getAuthenticatedUser,
  getMessageCount,
  isSiteOwner,
  setAuthCookie,
  verifyToken,
} from "../lib/auth";
import { FREE_MESSAGE_LIMIT } from "../lib/constants";

function selectWithLimit(result: unknown[]) {
  mocks.db.select.mockReturnValueOnce({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  });
}

describe("authentication helpers", () => {
  beforeEach(() => {
    mocks.env.SITE_OWNER_EMAIL = undefined;
    vi.unstubAllEnvs();
  });

  it("matches only the configured site owner with normalized casing", () => {
    expect(
      isSiteOwner({
        id: "owner",
        email: "  AbdulAchik@iCloud.com ",
        isAuthenticated: true,
      }),
    ).toBe(true);
    expect(
      isSiteOwner({
        id: "visitor",
        email: "visitor@example.com",
        isAuthenticated: true,
      }),
    ).toBe(false);
    expect(isSiteOwner({ isAuthenticated: false })).toBe(false);

    mocks.env.SITE_OWNER_EMAIL = "owner@example.com";
    expect(
      isSiteOwner({
        id: "owner",
        email: "OWNER@EXAMPLE.COM",
        isAuthenticated: true,
      }),
    ).toBe(true);
  });

  it("returns an unauthenticated user for missing, invalid, or failed cookies", async () => {
    mocks.cookies.mockResolvedValueOnce({ get: vi.fn(() => undefined) });
    await expect(getAuthenticatedUser()).resolves.toEqual({
      isAuthenticated: false,
    });

    mocks.cookies.mockResolvedValueOnce({
      get: vi.fn(() => ({ value: "unknown-user" })),
    });
    selectWithLimit([]);
    await expect(getAuthenticatedUser()).resolves.toEqual({
      isAuthenticated: false,
    });

    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.cookies.mockRejectedValueOnce(new Error("cookie store unavailable"));
    await expect(getAuthenticatedUser()).resolves.toEqual({
      isAuthenticated: false,
    });
    expect(error).toHaveBeenCalled();
  });

  it("returns the authenticated database user", async () => {
    mocks.cookies.mockResolvedValueOnce({
      get: vi.fn(() => ({ value: "user-1" })),
    });
    selectWithLimit([{ id: "user-1", email: "reader@example.com" }]);

    await expect(getAuthenticatedUser()).resolves.toEqual({
      id: "user-1",
      email: "reader@example.com",
      isAuthenticated: true,
    });
  });

  it("reuses an existing user or creates a verified one", async () => {
    selectWithLimit([{ id: "existing-user" }]);
    await expect(createUser("reader@example.com")).resolves.toBe(
      "existing-user",
    );

    selectWithLimit([]);
    const returning = vi.fn(() => Promise.resolve([{ id: "new-user" }]));
    const values = vi.fn(() => ({ returning }));
    mocks.db.insert.mockReturnValueOnce({ values });

    await expect(createUser("new@example.com")).resolves.toBe("new-user");
    expect(values).toHaveBeenCalledWith({
      email: "new@example.com",
      emailVerified: expect.any(Date),
    });
  });

  it("hides database details when user creation fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.db.select.mockImplementationOnce(() => {
      throw new Error("database unavailable");
    });

    await expect(createUser("reader@example.com")).rejects.toThrow(
      "Failed to create user",
    );
    expect(error).toHaveBeenCalled();
  });

  it("creates one-hour verification tokens and handles storage failure", async () => {
    const token = "11111111-1111-4111-8111-111111111111";
    vi.spyOn(crypto, "randomUUID").mockReturnValue(token);
    const values = vi.fn(
      (input: { token: string; email: string; expiresAt: Date }) => {
        void input;
        return Promise.resolve(undefined);
      },
    );
    mocks.db.insert.mockReturnValueOnce({ values });
    const before = Date.now();

    await expect(createVerificationToken("reader@example.com")).resolves.toBe(
      token,
    );
    expect(values).toHaveBeenCalledWith({
      token,
      email: "reader@example.com",
      expiresAt: expect.any(Date),
    });
    const expiresAt = values.mock.calls[0]?.[0].expiresAt;
    expect(expiresAt).toBeDefined();
    if (!expiresAt) throw new Error("Expected token expiry");
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + 3_599_000);

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.db.insert.mockImplementationOnce(() => {
      throw new Error("write failed");
    });
    await expect(createVerificationToken("reader@example.com")).rejects.toThrow(
      "Failed to create verification token",
    );
  });

  it("atomically verifies a valid token and rejects missing or failed tokens", async () => {
    const returning = vi.fn(() =>
      Promise.resolve([{ email: "reader@example.com" }]),
    );
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    mocks.db.update.mockReturnValueOnce({ set });

    await expect(verifyToken("valid-token")).resolves.toBe(
      "reader@example.com",
    );
    expect(set).toHaveBeenCalledWith({ used: true });
    expect(mocks.and).toHaveBeenCalled();

    mocks.db.update.mockReturnValueOnce({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([])),
        })),
      })),
    });
    await expect(verifyToken("expired-token")).resolves.toBeNull();

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.db.update.mockImplementationOnce(() => {
      throw new Error("update failed");
    });
    await expect(verifyToken("broken-token")).resolves.toBeNull();
  });

  it("sets a secure, HTTP-only auth cookie according to the environment", async () => {
    const set = vi.fn();
    mocks.cookies.mockResolvedValue({ set });
    vi.stubEnv("NODE_ENV", "production");

    await setAuthCookie("user-1");
    expect(set).toHaveBeenCalledWith("chat-auth", "user-1", {
      maxAge: 2_592_000,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.cookies.mockRejectedValueOnce(new Error("cookie write failed"));
    await expect(setAuthCookie("user-1")).rejects.toThrow(
      "Failed to set authentication cookie",
    );
  });

  it("counts user messages and fails closed when persistence is unavailable", async () => {
    mocks.db.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ count: 3 }])),
      })),
    });
    await expect(getMessageCount("session-1")).resolves.toBe(3);

    mocks.db.select.mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    });
    await expect(getMessageCount("session-2")).resolves.toBe(0);

    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.db.select.mockImplementationOnce(() => {
      throw new Error("read failed");
    });
    await expect(getMessageCount("session-3")).resolves.toBe(
      FREE_MESSAGE_LIMIT,
    );
  });
});
