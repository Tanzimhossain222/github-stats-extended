// @ts-check

import { api, getConfig } from "@stats-organization/github-readme-stats-core";
import supertest from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { app } from "../app.js";
import { generateETag, isFresh } from "../src/common/cache.js";
import { getUserAccessByName, storeRequest } from "../src/common/database.js";

vi.mock(import("@stats-organization/github-readme-stats-core"), async () => {
  const { mockCore } = await import("./utils.js");
  return mockCore();
});

vi.mock(import("../src/common/database.js"), async (importOriginal) => ({
  ...(await importOriginal()),
  storeRequest: vi.fn(),
  getUserAccessByName: vi.fn(),
}));

const apiMock = vi.mocked(api);
const getConfigMock = vi.mocked(getConfig);
const storeRequestMock = vi.mocked(storeRequest);
const getUserAccessByNameMock = vi.mocked(getUserAccessByName);

beforeEach(() => {
  apiMock.mockReset();
  getConfigMock.mockReset().mockReturnValue({});
  storeRequestMock.mockReset().mockResolvedValue(undefined);
  getUserAccessByNameMock.mockReset().mockResolvedValue(null);
  delete process.env.CACHE_SECONDS;
});

describe("Test Smart Caching & Conditional Revalidation (ETags & HTTP 304)", () => {
  it("generateETag should generate MD5 hex in quotes", () => {
    const etag1 = generateETag("<svg>content 1</svg>");
    const etag2 = generateETag("<svg>content 1</svg>");
    const etag3 = generateETag("<svg>content 2</svg>");

    expect(etag1).toBe(etag2);
    expect(etag1).toMatch(/^"[a-f0-9]{32}"$/);
    expect(etag1).not.toBe(etag3);
  });

  it("isFresh should handle exact matches, weak prefixes, and comma lists", () => {
    const etag = '"abc123"';

    expect(isFresh({ headers: { "if-none-match": '"abc123"' } }, etag)).toBe(
      true,
    );
    expect(isFresh({ headers: { "if-none-match": 'W/"abc123"' } }, etag)).toBe(
      true,
    );
    expect(
      isFresh({ headers: { "if-none-match": '"xyz", "abc123"' } }, etag),
    ).toBe(true);
    expect(isFresh({ headers: { "if-none-match": '"other"' } }, etag)).toBe(
      false,
    );
    expect(isFresh({ headers: {} }, etag)).toBe(false);
  });

  it("should return 200 with ETag header on initial request", async () => {
    const svgContent = "<svg>stats card content</svg>";
    apiMock.mockResolvedValue({
      status: "success",
      content: svgContent,
    });

    const res = await supertest(app)
      .get("/api?username=anuraghazra")
      .expect(200)
      .expect("Content-Type", "image/svg+xml");

    const expectedETag = generateETag(svgContent);
    expect(res.headers["etag"]).toBe(expectedETag);
    expect(res.body.toString()).toBe(svgContent);
  });

  it("should return 304 Not Modified when If-None-Match matches ETag", async () => {
    const svgContent = "<svg>stats card content</svg>";
    apiMock.mockResolvedValue({
      status: "success",
      content: svgContent,
    });
    const etag = generateETag(svgContent);

    const res = await supertest(app)
      .get("/api?username=anuraghazra")
      .set("If-None-Match", etag)
      .expect(304);

    expect(res.headers["etag"]).toBe(etag);
    expect(res.body.toString()).toBe("");
  });

  it("should return 304 when If-None-Match is a weak ETag", async () => {
    const svgContent = "<svg>stats card content</svg>";
    apiMock.mockResolvedValue({
      status: "success",
      content: svgContent,
    });
    const etag = generateETag(svgContent);

    const res = await supertest(app)
      .get("/api?username=anuraghazra")
      .set("If-None-Match", `W/${etag}`)
      .expect(304);

    expect(res.headers["etag"]).toBe(etag);
    expect(res.body.toString()).toBe("");
  });

  it("should return 200 when If-None-Match does not match", async () => {
    const svgContent = "<svg>stats card content</svg>";
    apiMock.mockResolvedValue({
      status: "success",
      content: svgContent,
    });

    const res = await supertest(app)
      .get("/api?username=anuraghazra")
      .set("If-None-Match", '"stale-etag"')
      .expect(200);

    const expectedETag = generateETag(svgContent);
    expect(res.headers["etag"]).toBe(expectedETag);
    expect(res.body.toString()).toBe(svgContent);
  });
});
