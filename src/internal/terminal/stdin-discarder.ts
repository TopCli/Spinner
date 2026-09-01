// Import Node.js Dependencies
import type { ReadStream } from "node:tty";

// Ctrl+C
const kAsciiEtxCode = 0x03;

/**
 * Prevents input corrupting rendered rows and restores stdin after the last consumer.
 * Ported from https://github.com/sindresorhus/stdin-discarder.
 */
class StdinDiscarder {
  #activeCount = 0;
  #stdin: ReadStream | undefined;
  #stdinWasPaused = false;
  #stdinWasRaw = false;

  #handleInput = (chunk: Buffer | string) => {
    if (!chunk?.length) {
      return;
    }

    const code = typeof chunk === "string" ? chunk.codePointAt(0) : chunk[0];
    if (code === kAsciiEtxCode) {
      process.kill(process.pid, "SIGINT");
    }
  };

  start(): void {
    if (this.#activeCount++ === 0) {
      this.#realStart();
    }
  }

  stop(): void {
    if (this.#activeCount === 0) {
      return;
    }

    if (--this.#activeCount === 0) {
      this.#realStop();
    }
  }

  #realStart() {
    const { stdin } = process;

    if (
      process.platform === "win32" ||
      !stdin?.isTTY ||
      typeof stdin.setRawMode !== "function"
    ) {
      this.#stdin = undefined;

      return;
    }

    this.#stdin = stdin;
    this.#stdinWasPaused = stdin.isPaused();
    this.#stdinWasRaw = Boolean(stdin.isRaw);

    stdin.setRawMode(true);
    stdin.prependListener("data", this.#handleInput);

    if (this.#stdinWasPaused) {
      stdin.resume();
    }
  }

  #realStop() {
    const stdin = this.#stdin;
    if (stdin === undefined) {
      return;
    }

    stdin.off("data", this.#handleInput);

    if (stdin.isTTY) {
      stdin.setRawMode(this.#stdinWasRaw);
    }
    if (this.#stdinWasPaused) {
      stdin.pause();
    }

    this.#stdin = undefined;
    this.#stdinWasPaused = false;
    this.#stdinWasRaw = false;
  }
}

export const stdinDiscarder = new StdinDiscarder();
