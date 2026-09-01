// Import Node.js Dependencies
import type { styleText } from "node:util";

export type Color = Parameters<typeof styleText>[0];

/**
 * Writable stream contract used by the spinner.
 * Non-TTY streams receive plain, non-animated output.
 */
export interface SpinnerStream extends NodeJS.WritableStream {
  isTTY?: boolean | undefined;
  columns?: number | undefined;
  rows?: number | undefined;
}
