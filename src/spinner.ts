// Import Node.js Dependencies
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import { inspect, stripVTControlCharacters, styleText } from "node:util";

// Import Third-party Dependencies
import * as cliSpinners from "cli-spinners";

// Import Internal Dependencies
import {
  getRenderer,
  type RendererRow,
  type RendererSession
} from "./internal/renderer.ts";
import { sanitizeTerminalText } from "./internal/terminal/ansi.ts";
import { truncateToWidth } from "./internal/terminal/width.ts";
import type { Color, SpinnerStream } from "./types.ts";

const kDefaultSpinnerName = "dots" satisfies cliSpinners.SpinnerName;
const kDefaultColumns = 80;
const kDefaultInterval = 100;
const kAvailableColors = new Set<string>(Object.keys(inspect.colors));
const kUnicodeSupported = process.platform !== "win32" ||
  Boolean(process.env.CI) ||
  process.env.TERM === "xterm-256color";
const kSymbols = kUnicodeSupported ?
  { success: "✔", error: "✖" } :
  { success: "√", error: "×" };
export type SpinnerEvents = {
  start: [];
  succeed: [];
  failed: [];
  stopped: [];
};

export interface SpinnerOptions {
  /**
   * @default "dots"
   */
  name?: cliSpinners.SpinnerName;
  color?: Color;
  /**
   * @default true
   */
  verbose?: boolean;
  /**
   * Non-TTY streams receive one plain line. @default process.stdout
   */
  stream?: SpinnerStream;
  /**
   * @default true
   */
  hideCursor?: boolean;
  /**
   * Prevents input from being echoed into the rendered block. @default true
   */
  discardStdin?: boolean;
}

export interface StartOptions {
  withPrefix?: string;
}

type SpinnerRun =
  | { mode: "silent" | "plain"; }
  | { mode: "animated"; session: RendererSession; };

export class Spinner extends EventEmitter<SpinnerEvents> {
  readonly #stream: SpinnerStream;
  readonly #renderer: ReturnType<typeof getRenderer>;
  readonly #spinner: cliSpinners.Spinner;
  readonly #color: (frame: string) => string;
  readonly #verbose: boolean;
  readonly #hideCursor: boolean;
  readonly #discardStdin: boolean;
  readonly #row: RendererRow;

  #run: SpinnerRun | null = null;
  #text = "";
  #prefix = "";
  #symbol: string | null = null;
  #startTime: number | undefined;

  constructor(
    options: SpinnerOptions = {}
  ) {
    super();

    const {
      name = kDefaultSpinnerName,
      color = null,
      verbose = true,
      stream = process.stdout,
      hideCursor = true,
      discardStdin = true
    } = options;

    this.#verbose = verbose;
    this.#stream = stream;
    this.#renderer = getRenderer(stream);
    this.#hideCursor = hideCursor;
    this.#discardStdin = discardStdin;
    this.#spinner = cliSpinners.default[name] ?? cliSpinners.default[kDefaultSpinnerName];
    this.#color = this.#createColorizer(color);
    this.#row = {
      interval: this.#spinner.interval ?? kDefaultInterval,
      render: () => this.#renderRow()
    };
  }

  #createColorizer(
    color: Color | null
  ): (frame: string) => string {
    if (color === null) {
      return (frame) => frame;
    }

    const formats = Array.isArray(color) ? color : [color];
    const hasColor = formats.every(
      (format) => kAvailableColors.has(format)
    );
    const validated = hasColor ? color : "white";

    return (frame) => styleText(validated, frame, { stream: this.#stream });
  }

  get stream() {
    return this.#stream;
  }

  get started() {
    return this.#run !== null;
  }

  get verbose() {
    return this.#verbose;
  }

  get startTime(): number | undefined {
    return this.#startTime;
  }

  get elapsedTime(): number {
    return this.#startTime === undefined
      ? 0
      : performance.now() - this.#startTime;
  }

  set text(value: string | undefined) {
    if (typeof value === "string") {
      this.#text = sanitizeTerminalText(value);
    }
  }

  get text() {
    return this.#text;
  }

  #nextFrame(): string {
    const { frames } = this.#spinner;

    const index = Math.floor(
      this.elapsedTime / this.#row.interval
    ) % frames.length;

    return this.#color(frames[index]);
  }

  #line(
    symbol: string
  ): string {
    return `${symbol} ${this.#prefix}${this.#text}`;
  }

  #renderRow(): string {
    /**
     * Keep one column free to prevent terminal wrapping.
     */
    const columns = (this.#stream.columns ?? kDefaultColumns) - 1;

    return truncateToWidth(
      this.#line(this.#symbol ?? this.#nextFrame()),
      columns
    );
  }

  #writePlainLine(
    symbol: string
  ): void {
    const line = stripVTControlCharacters(this.#line(symbol)).trim();
    if (line !== "") {
      this.#stream.write(`${line}\n`);
    }
  }

  start(
    text?: string,
    options: StartOptions = {}
  ) {
    if (this.#run !== null) {
      return this;
    }

    this.text = text;
    if (typeof options.withPrefix === "string") {
      this.#prefix = sanitizeTerminalText(options.withPrefix);
    }

    this.#symbol = null;
    this.#startTime = performance.now();
    if (!this.#verbose) {
      this.#run = { mode: "silent" };
    }
    else if (this.#renderer.enabled) {
      this.#run = {
        mode: "animated",
        session: this.#renderer.add(this.#row, {
          hideCursor: this.#hideCursor,
          discardStdin: this.#discardStdin
        })
      };
    }
    else {
      this.#run = { mode: "plain" };
      this.#writePlainLine("-");
    }
    this.emit("start");

    return this;
  }

  #persist(
    symbol: string,
    event: "succeed" | "failed",
    text?: string
  ) {
    const run = this.#run;
    if (run === null) {
      return this;
    }

    this.text = text;
    this.#run = null;

    if (run.mode === "animated") {
      this.#symbol = symbol;
      run.session.freeze();
    }
    else if (run.mode === "plain") {
      this.#writePlainLine(symbol);
    }
    this.emit(event);

    return this;
  }

  succeed(
    text?: string
  ) {
    return this.#persist(
      styleText(
        "green",
        kSymbols.success,
        { stream: this.#stream }
      ),
      "succeed",
      text
    );
  }

  failed(
    text?: string
  ) {
    return this.#persist(
      styleText(
        "red",
        kSymbols.error,
        { stream: this.#stream }
      ),
      "failed",
      text
    );
  }

  stop() {
    const run = this.#run;
    if (run === null) {
      return this;
    }

    this.#run = null;
    if (run.mode === "animated") {
      run.session.remove();
    }
    this.emit("stopped");

    return this;
  }
}
