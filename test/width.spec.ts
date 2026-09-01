// Import Node.js Dependencies
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { styleText } from "node:util";

// Import Internal Dependencies
import { ESCAPES } from "../src/internal/terminal/ansi.ts";
import {
  stringWidth,
  truncateToWidth
} from "../src/internal/terminal/width.ts";

// CONSTANTS
const kStyled = styleText("red", "foobar", { validateStream: false });

describe("stringWidth", () => {
  it("should count one column per latin character", () => {
    assert.equal(stringWidth(""), 0);
    assert.equal(stringWidth("foobar"), 6);
  });

  it("should ignore ANSI escape sequences", () => {
    assert.equal(stringWidth(kStyled), 6);
  });

  it("should count two columns for wide characters", () => {
    assert.equal(stringWidth("日本語"), 6);
    assert.equal(stringWidth("🚀"), 2);
  });

  it("should count one column for a grapheme cluster made of several code points", () => {
    assert.equal(stringWidth("é"), 1);
    assert.equal(stringWidth("👍🏽"), 2);
  });

  it("should count emoji presentation sequences as two columns", () => {
    assert.equal(stringWidth("©️"), 2);
    assert.equal(stringWidth("1️⃣"), 2);
  });

  it("should not count the spinner and log symbols as wide characters", () => {
    assert.equal(stringWidth("✔"), 1);
    assert.equal(stringWidth("✖"), 1);
    assert.equal(stringWidth("⠋"), 1);
  });
});

describe("truncateToWidth", () => {
  it("should return the input when it fits", () => {
    assert.equal(truncateToWidth("foobar", 10), "foobar");
    assert.equal(truncateToWidth("foobar", 6), "foobar");
  });

  it("should return an empty string when there is no room left", () => {
    assert.equal(truncateToWidth("foobar", 0), "");
    assert.equal(truncateToWidth("foobar", -1), "");
  });

  it("should never cut a wide character in half", () => {
    assert.equal(truncateToWidth("日本語", 5), "日本");
    assert.equal(truncateToWidth("日本語", 6), "日本語");
  });

  it("should keep the escape sequences and reset the style when truncating", () => {
    const truncated = truncateToWidth(kStyled, 3);

    assert.ok(truncated.startsWith(kStyled.slice(0, kStyled.indexOf("foobar"))));
    assert.ok(truncated.endsWith(ESCAPES.reset));
    assert.equal(stringWidth(truncated), 3);
  });

  it("should not append a reset sequence to an unstyled string", () => {
    assert.equal(truncateToWidth("foobar", 3), "foo");
  });
});
