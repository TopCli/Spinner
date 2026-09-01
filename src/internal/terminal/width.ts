// Import Node.js Dependencies
import { stripVTControlCharacters } from "node:util";

// Import Internal Dependencies
import {
  ESCAPES,
  isAnsiSequence,
  splitAnsi
} from "./ansi.ts";

const kSegmenter = new Intl.Segmenter();
const kEmojiPresentationRegExp = /^\p{Emoji_Presentation}/u;
const kVariationSelector16RegExp = /\uFE0F/u;

/**
 * East Asian Wide/Fullwidth ranges.
 * @see https://www.unicode.org/Public/UCD/latest/ucd/EastAsianWidth.txt
 */
const kWideRanges: readonly (readonly [number, number])[] = [
  [0x1100, 0x115F],
  [0x2329, 0x232A],
  [0x2E80, 0x303E],
  [0x3041, 0x33FF],
  [0x3400, 0x4DBF],
  [0x4E00, 0x9FFF],
  [0xA000, 0xA4CF],
  [0xA960, 0xA97F],
  [0xAC00, 0xD7A3],
  [0xF900, 0xFAFF],
  [0xFE10, 0xFE19],
  [0xFE30, 0xFE6F],
  [0xFF00, 0xFF60],
  [0xFFE0, 0xFFE6],
  [0x1B000, 0x1B001],
  [0x1F200, 0x1F251],
  [0x1F300, 0x1F64F],
  [0x1F900, 0x1F9FF],
  [0x20000, 0x3FFFD]
];

function isWideCodePoint(
  codePoint: number
): boolean {
  return kWideRanges.some(
    ([start, end]) => codePoint >= start && codePoint <= end
  );
}

function graphemeWidth(
  grapheme: string
): number {
  const codePoint = grapheme.codePointAt(0) ?? 0;

  // C0/C1 controls have no display width.
  if (codePoint < 0x20 || (codePoint >= 0x7F && codePoint <= 0x9F)) {
    return 0;
  }
  if (
    kEmojiPresentationRegExp.test(grapheme) ||
    kVariationSelector16RegExp.test(grapheme)
  ) {
    return 2;
  }
  if (codePoint < 0x1100) {
    return 1;
  }

  return isWideCodePoint(codePoint) ? 2 : 1;
}

export function stringWidth(
  input: string
): number {
  let width = 0;
  const strippedInput = stripVTControlCharacters(input);
  for (const { segment } of kSegmenter.segment(strippedInput)) {
    width += graphemeWidth(segment);
  }

  return width;
}

/**
 * Preserves whole ANSI sequences and appends a reset after styled truncation.
 */
export function truncateToWidth(
  input: string,
  maxWidth: number
): string {
  if (maxWidth <= 0) {
    return "";
  }

  let output = "";
  let width = 0;
  let styled = false;
  let truncated = false;

  for (const token of splitAnsi(input)) {
    if (!token) {
      continue;
    }

    if (isAnsiSequence(token)) {
      output += token;
      styled = true;
      continue;
    }

    for (const { segment } of kSegmenter.segment(token)) {
      const segmentWidth = graphemeWidth(segment);
      if (width + segmentWidth > maxWidth) {
        truncated = true;
        break;
      }

      width += segmentWidth;
      output += segment;
    }

    if (truncated) {
      break;
    }
  }

  return truncated && styled
    ? output + ESCAPES.reset
    : output;
}
