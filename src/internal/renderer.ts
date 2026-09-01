// Import Internal Dependencies
import { cursorUp, ESCAPES } from "./terminal/ansi.ts";
import { hideCursor, showCursor } from "./terminal/cursor.ts";
import { stdinDiscarder } from "./terminal/stdin-discarder.ts";
import { isInteractive } from "./terminal/stream.ts";
import type { SpinnerStream } from "../types.ts";

const kRenderers = new WeakMap<SpinnerStream, SpinnerRenderer>();

export interface RendererRow {
  readonly interval: number;
  render(): string;
}

export interface RendererOptions {
  hideCursor?: boolean;
  discardStdin?: boolean;
}

export interface RendererSession {
  freeze(): void;
  remove(): void;
}

interface RendererEntry {
  readonly row: RendererRow;
  readonly options: Required<RendererOptions>;
  state: "active" | "frozen";
  snapshot: string;
}

export class SpinnerRenderer {
  readonly #stream: SpinnerStream;
  readonly #rows: RendererEntry[] = [];

  #painted = 0;
  #timer: NodeJS.Timeout | null = null;
  #cursorHidden = false;
  #stdinDiscarding = false;

  constructor(stream: SpinnerStream) {
    this.#stream = stream;
  }

  get enabled(): boolean {
    return isInteractive(this.#stream);
  }

  add(
    row: RendererRow,
    options: RendererOptions = {}
  ): RendererSession {
    const entry: RendererEntry = {
      row,
      options: {
        hideCursor: options.hideCursor ?? true,
        discardStdin: options.discardStdin ?? true
      },
      state: "active",
      snapshot: ""
    };

    this.#rows.push(entry);
    this.#reconcileTerminal();
    this.#paint();
    this.#restartLoop();

    let active = true;

    return {
      freeze: () => {
        if (active) {
          active = false;
          this.#freeze(entry);
        }
      },
      remove: () => {
        if (active) {
          active = false;
          this.#remove(entry);
        }
      }
    };
  }

  #freeze(
    entry: RendererEntry
  ): void {
    if (entry.state !== "active" || !this.#rows.includes(entry)) {
      return;
    }

    entry.snapshot = entry.row.render();
    entry.state = "frozen";
    this.#paint();
    this.#settle();
  }

  #remove(entry: RendererEntry): void {
    const index = this.#rows.indexOf(entry);
    if (index === -1) {
      return;
    }

    this.#rows.splice(index, 1);
    this.#paint();
    this.#settle();
  }

  #paint(): void {
    const removedLines = Math.max(
      this.#painted - this.#rows.length,
      0
    );

    let frame = ESCAPES.beginSynchronizedUpdate + cursorUp(this.#painted);
    for (const entry of this.#rows) {
      const output = entry.state === "active"
        ? entry.row.render()
        : entry.snapshot;
      frame += `${ESCAPES.clearLine}${output}\n`;
    }
    frame += `${ESCAPES.clearLine}\n`.repeat(removedLines);
    frame += cursorUp(removedLines);
    frame += ESCAPES.endSynchronizedUpdate;

    this.#painted = this.#rows.length;
    this.#stream.write(frame);
  }

  #restartLoop(): void {
    this.#stopLoop();
    const activeRows = this.#rows.filter(
      ({ state }) => state === "active"
    );
    if (activeRows.length === 0) {
      return;
    }

    const interval = Math.min(
      ...activeRows.map(({ row }) => row.interval)
    );
    this.#timer = setInterval(
      () => this.#paint(),
      interval
    );
    this.#timer.unref();
  }

  #stopLoop(): void {
    if (this.#timer !== null) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
  }

  #reconcileTerminal(): void {
    const activeRows = this.#rows.filter(
      ({ state }) => state === "active"
    );
    const shouldHideCursor = activeRows.some(
      ({ options }) => options.hideCursor
    );
    const shouldDiscardStdin = activeRows.some(
      ({ options }) => options.discardStdin
    );

    if (shouldHideCursor && !this.#cursorHidden) {
      hideCursor(this.#stream);
    }
    else if (!shouldHideCursor && this.#cursorHidden) {
      showCursor(this.#stream);
    }
    this.#cursorHidden = shouldHideCursor;

    if (shouldDiscardStdin && !this.#stdinDiscarding) {
      stdinDiscarder.start();
    }
    else if (!shouldDiscardStdin && this.#stdinDiscarding) {
      stdinDiscarder.stop();
    }
    this.#stdinDiscarding = shouldDiscardStdin;
  }

  #settle(): void {
    if (this.#rows.some(({ state }) => state === "active")) {
      this.#restartLoop();
      this.#reconcileTerminal();

      return;
    }

    this.#stopLoop();
    this.#rows.length = 0;
    this.#painted = 0;
    this.#reconcileTerminal();
  }
}

export function getRenderer(
  stream: SpinnerStream
): SpinnerRenderer {
  let renderer = kRenderers.get(stream);
  if (renderer === undefined) {
    renderer = new SpinnerRenderer(stream);
    kRenderers.set(stream, renderer);
  }

  return renderer;
}
