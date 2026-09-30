import test from "node:test";
import assert from "node:assert/strict";
import {
  editorialPayloadSchema,
  extractContentMediaIds,
  richHtmlToText,
  sanitizeRichHtml,
  slugifyEditorialTitle,
  validateEditorialPublication,
} from "@/lib/contentCms";

test("editorial HTML sanitizer removes active content and unsafe attributes", () => {
  const safeId = "123e4567-e89b-12d3-a456-426614174000";
  const html = sanitizeRichHtml(`
    <div onclick="alert(1)">
      <script>alert("x")</script>
      <h2 id="bad">Heading</h2>
      <p style="color:red">Hello <strong>world</strong></p>
      <a href="javascript:alert(1)" target="_blank">bad link</a>
      <a href="https://example.com/path">external</a>
      <img src="https://evil.example/tracker.png" onerror="alert(1)" alt="tracker">
      <img src="/api/content/media/${safeId}" onerror="alert(1)" alt="Team photo">
    </div>
  `);

  assert.equal(html.includes("<script"), false);
  assert.equal(html.includes("onclick"), false);
  assert.equal(html.includes("onerror"), false);
  assert.equal(html.includes("style="), false);
  assert.equal(html.includes("javascript:"), false);
  assert.equal(html.includes("evil.example"), false);
  assert.equal(html.includes(`/api/content/media/${safeId}`), true);
  assert.equal(html.includes('rel="noopener noreferrer"'), true);
  assert.equal(html.includes('target="_blank"'), true);
});

test("editorial media extraction returns only unique HireGo content-media ids", () => {
  const first = "123e4567-e89b-12d3-a456-426614174000";
  const second = "123e4567-e89b-12d3-a456-426614174001";
  const html = `<p>Text</p><img src="/api/content/media/${first}" alt=""><img src="/api/content/media/${first}" alt=""><img src="/api/content/media/${second}" alt="">`;
  assert.deepEqual(extractContentMediaIds(html), [first, second]);
});

test("editorial text and slug normalization are deterministic", () => {
  assert.equal(richHtmlToText("<h2>Hello</h2><p>HireGo   AI</p>"), "HelloHireGo AI");
  assert.equal(slugifyEditorialTitle("  HireGo AI: Future of Hiring!  "), "hirego-ai-future-of-hiring");
});

test("editorial schema rejects external canonical domains", () => {
  const base = {
    type: "BLOG" as const,
    title: "A production article",
    slug: "a-production-article",
    contentHtml: "<p>This is a long enough article body for validation.</p>",
    tags: [],
  };
  assert.equal(editorialPayloadSchema.safeParse({ ...base, canonicalUrl: "https://hiregoai.com/blog/a-production-article" }).success, true);
  assert.equal(editorialPayloadSchema.safeParse({ ...base, canonicalUrl: "https://example.com/article" }).success, false);
});


test("editorial sanitizer keeps tables, CTA links and trusted video embeds only", () => {
  const html = sanitizeRichHtml(`
    <table><tbody><tr><td>Signal</td><td>Evidence</td></tr></tbody></table>
    <a data-cta="primary" href="/register" onclick="remove-me()">Get started</a>
    <iframe src="https://www.youtube-nocookie.com/embed/abcDEF12345" title="Demo"></iframe>
    <iframe src="https://invalid.example/embed/abcDEF12345" title="Tracker"></iframe>
  `);

  assert.equal(html.includes("<table>"), true);
  assert.equal(html.includes('data-cta="primary"'), true);
  assert.equal(html.includes("onclick"), false);
  assert.equal(html.includes("youtube-nocookie.com/embed/abcDEF12345"), true);
  assert.equal(html.includes("invalid.example"), false);
});

test("publication requires accessible alt text when a featured image is present", () => {
  assert.throws(
    () => validateEditorialPublication({
      type: "BLOG",
      status: "PUBLISHED",
      title: "Accessible publishing",
      contentText: "This body is deliberately long enough to pass the publication content threshold.",
      featuredImageFileId: "123e4567-e89b-12d3-a456-426614174000",
      featuredImageAlt: "",
    }),
    /alternative text/i,
  );
});
