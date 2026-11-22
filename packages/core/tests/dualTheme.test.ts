import { describe, expect, it } from "vitest";

import { renderGistCard } from "../src/cards/gist.js";
import { renderRepoCard } from "../src/cards/repo.js";
import { renderStatsCard } from "../src/cards/stats.js";
import { renderTopLanguages } from "../src/cards/top-languages.js";
import { renderWakatimeCard } from "../src/cards/wakatime.js";
import type {
  GistData,
  RepositoryData,
  StatsData,
  TopLangData,
} from "../src/fetchers/types.js";

import { wakaTimeData } from "./fixtures/wakatime.js";

const stats: StatsData = {
  name: "Test User",
  totalStars: 100,
  totalCommits: 200,
  totalIssues: 300,
  totalPRs: 400,
  totalPRsMerged: 320,
  mergedPRsPercentage: 80,
  totalReviews: 50,
  totalDiscussionsStarted: 10,
  totalDiscussionsAnswered: 50,
  contributedTo: 500,
  allTimeContributedTo: 500,
  totalPRsAuthored: 100,
  totalPRsCommented: 100,
  totalPRsReviewed: 100,
  totalIssuesAuthored: 100,
  totalIssuesCommented: 100,
  totalContributions: 5000,
  rank: { level: "A+", percentile: 40 },
};

const topLangs: TopLangData = {
  TypeScript: { color: "#3178c6", name: "TypeScript", size: 1000, count: 5 },
  JavaScript: { color: "#f1e05a", name: "JavaScript", size: 500, count: 3 },
};

const repo: RepositoryData = {
  name: "test-repo",
  nameWithOwner: "user/test-repo",
  description: "A great repo",
  primaryLanguage: { name: "TypeScript", color: "#3178c6" },
  isPrivate: false,
  isArchived: false,
  isTemplate: false,
  stargazerCount: 150,
  forkCount: 20,
  totalPRsAuthored: 0,
  totalPRsCommented: 0,
  totalPRsReviewed: 0,
  totalIssuesAuthored: 0,
  totalIssuesCommented: 0,
};

const gist: GistData = {
  name: "test-gist",
  nameWithOwner: "user/test-gist",
  description: "A cool gist",
  language: "TypeScript",
  starsCount: 12,
  forksCount: 3,
};

describe("Dual-Theme Adaptive Cards (theme_dark)", () => {
  it("renderStatsCard should include @media (prefers-color-scheme: dark) with dark theme colors", () => {
    const card = renderStatsCard(stats, {
      theme: "default",
      theme_dark: "radical",
    });

    expect(card).toContain("@media (prefers-color-scheme: dark)");
    // radical titleColor is #fe428e
    expect(card).toContain("#fe428e");
  });

  it("renderTopLanguages should include @media (prefers-color-scheme: dark) when theme_dark is set", () => {
    const card = renderTopLanguages(topLangs, {
      theme: "default",
      theme_dark: "tokyonight",
    });

    expect(card).toContain("@media (prefers-color-scheme: dark)");
    // tokyonight titleColor is #70a5fd
    expect(card).toContain("#70a5fd");
  });

  it("renderWakatimeCard should include @media (prefers-color-scheme: dark) when theme_dark is set", () => {
    const card = renderWakatimeCard(wakaTimeData.data, {
      theme: "default",
      theme_dark: "radical",
    });

    expect(card).toContain("@media (prefers-color-scheme: dark)");
    expect(card).toContain("#fe428e");
  });

  it("renderRepoCard should include @media (prefers-color-scheme: dark) when theme_dark is set", () => {
    const card = renderRepoCard(repo, {
      theme: "default_repocard",
      theme_dark: "radical",
    });

    expect(card).toContain("@media (prefers-color-scheme: dark)");
    expect(card).toContain("#fe428e");
  });

  it("renderGistCard should include @media (prefers-color-scheme: dark) when theme_dark is set", () => {
    const card = renderGistCard(gist, {
      theme: "default_repocard",
      theme_dark: "radical",
    });

    expect(card).toContain("@media (prefers-color-scheme: dark)");
    expect(card).toContain("#fe428e");
  });

  it("cards should omit @media (prefers-color-scheme: dark) when no dark overrides are set", () => {
    const card = renderStatsCard(stats, { theme: "default" });
    expect(card).not.toContain("@media (prefers-color-scheme: dark)");
  });
});
