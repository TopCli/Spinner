// Import Internal Dependencies
import type { SpinnerStream } from "../../types.ts";

/**
 * Based on https://github.com/sindresorhus/is-interactive.
 */
export function isInteractive(
  stream: SpinnerStream
): boolean {
  return Boolean(
    stream.isTTY &&
    process.env.TERM !== "dumb" &&
    !("CI" in process.env)
  );
}
