// ANSI control sequences used by the terminal renderer.
const kEsc = String.fromCharCode(0x1B);
const kCsi = `${kEsc}[`;
const kBell = String.fromCharCode(0x07);
const kEightBitCsi = String.fromCharCode(0x9B);
const kEightBitStringTerminator = String.fromCharCode(0x9C);
const kBackslash = String.fromCharCode(0x5C);

/**
 * Pattern adapted from https://github.com/chalk/ansi-regex.
 */
const kStringTerminator = `(?:${kBell}|${kEsc}${kBackslash}|${kEightBitStringTerminator})`;
const kAnsiPattern = [
  `[${kEsc}${kEightBitCsi}][[${kBackslash}]()#;?]*` +
  "(?:(?:(?:(?:;[-a-zA-Z0-9/#&.:=?%@~_]+)*" +
  `|[a-zA-Z0-9]+(?:;[-a-zA-Z0-9/#&.:=?%@~_]*)*)?${kStringTerminator})`,
  "(?:(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PR-TZcf-nq-uy=><~]))"
].join("|");

// The capture group makes `String#split` yield the escape sequences as standalone tokens.
const kAnsiSplitRegExp = new RegExp(`(${kAnsiPattern})`);
const kAnsiTokenRegExp = new RegExp(`^(?:${kAnsiPattern})$`);
const kSgrTokenRegExp = new RegExp(`^${kEsc}\\[[0-9;:]*m$`);
const kControlCharacterRegExp = /\p{Cc}/gu;

export const ESCAPES = {
  reset: `${kCsi}0m`,
  clearLine: `${kCsi}2K`,
  hideCursor: `${kCsi}?25l`,
  showCursor: `${kCsi}?25h`,
  /**
   * DEC mode 2026 buffers one frame. Unsupported terminals ignore it.
   */
  beginSynchronizedUpdate: `${kCsi}?2026h`,
  endSynchronizedUpdate: `${kCsi}?2026l`
} as const;

export function splitAnsi(
  input: string
): string[] {
  return input.split(kAnsiSplitRegExp);
}

export function isAnsiSequence(
  token: string
): boolean {
  return kAnsiTokenRegExp.test(token);
}

/**
 * Preserve text styling while removing controls that can alter terminal layout.
 */
export function sanitizeTerminalText(
  input: string
): string {
  let output = "";

  for (const token of splitAnsi(input)) {
    if (kSgrTokenRegExp.test(token)) {
      output += token;
    }
    else if (!isAnsiSequence(token)) {
      output += token.replaceAll(kControlCharacterRegExp, "");
    }
  }

  return output;
}

export function cursorUp(
  lines: number
): string {
  return lines > 0 ? `${kCsi}${lines}A` : "";
}
