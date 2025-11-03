// Import Node.js Dependencies
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import { inspect, styleText } from "node:util";
import readline from "node:readline";
import * as TTY from "node:tty";

// Import Third-party Dependencies
import * as cliSpinners from "cli-spinners";

// Import Internal Dependencies
import {
  stringLength,
  type Color
} from "./utils/index.js";

// VARS
let internalSpinnerCount = 0;

// CONSTANTS
const kDefaultSpinnerName = "dots" satisfies cliSpinners.SpinnerName;
const kAvailableColors = new Set<Color>(
  Object.keys(inspect.colors) as Color[]
);

const kLogSymbols = process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color" ?
  { success: styleText("green", "✔"), error: styleText("red", "✖") } :
  { success: styleText("green", "√"), error: styleText("red", "×") };

export interface SpinnerOptions {
  /**
   * Spinner name (from cli-spinners lib)
   *
   * @default "dots"
   */
  name?: cliSpinners.SpinnerName;
  /**
   * Spinner frame color
   *
   * @default "white"
   */
  color?: Color;
  /**
   * Do not log anything when disabled
   *
   * @default true
   */
  verbose?: boolean;
}

export interface StartOptions {
  withPrefix?: string;
}

export class Spinner extends EventEmitter {
  static reset() {
    internalSpinnerCount = 0;
  }

  public stream: TTY.WriteStream = process.stdout;

  #verbose = true;
  #started = false;
  #spinner: cliSpinners.Spinner;
  #text = "";
  #prefix = "";
  #color: (stdout: string) => string;

  #interval: NodeJS.Timeout | null = null;
  #frameIndex = 0;
  #spinnerPos = 0;
  #startTime: number;

  constructor(options: SpinnerOptions = {}) {
    super();
    this.#verbose = options.verbose ?? true;
    if (!this.#verbose) {
      return;
    }

    const { name = kDefaultSpinnerName, color = null } = options;

    this.#spinner = name in cliSpinners.default ?
      cliSpinners.default[name] :
      cliSpinners.default[kDefaultSpinnerName];
    if (color === null) {
      this.#color = (str: string) => str;
    }
    else {
      const colorArr = Array.isArray(color) ? color : [color];

      this.#color = colorArr.every((color) => kAvailableColors.has(color)) ?
        (str) => styleText(color, str) :
        (str) => styleText("white", str);
    }
  }

  get started() {
    return this.#started;
  }

  get verbose() {
    return this.#verbose;
  }

  get elapsedTime() {
    return performance.now() - this.#startTime;
  }

  get startTime() {
    return this.#startTime;
  }

  set text(value: string | undefined) {
    if (typeof value == "string") {
      this.#text = value.replaceAll(/\r?\n|\r/gm, "");
    }
  }

  get text() {
    return this.#text;
  }

  #getSpinnerFrame(spinnerSymbol?: string) {
    if (typeof spinnerSymbol === "string") {
      return spinnerSymbol;
    }

    const { frames } = this.#spinner;
    const frame = frames[this.#frameIndex];
    this.#frameIndex = ++this.#frameIndex < frames.length ? this.#frameIndex : 0;

    return this.#color(frame);
  }

  #lineToRender(spinnerSymbol?: string) {
    const terminalCol = this.stream.columns;
    const defaultRaw = `${this.#getSpinnerFrame(spinnerSymbol)} ${this.#prefix}${this.text}`;

    let regexArray: any[];
    let count = 0;
    while (1) {
      regexArray = defaultRaw
        .slice(0, terminalCol + count)
        .match(ansiRegex()) ?? [];
      if (regexArray.length === count) {
        break;
      }
      count = regexArray.length;
    }
    count += regexArray!.reduce((prev, curr) => prev + stringLength(curr), 0);

    return stringLength(defaultRaw) > terminalCol ?
      `${defaultRaw.slice(0, terminalCol + count)}\x1B[0m` :
      defaultRaw;
  }

  #renderLine(spinnerSymbol?: string) {
    if (!this.#verbose) {
      return;
    }

    const moveCursorPos = internalSpinnerCount - this.#spinnerPos;
    readline.moveCursor(this.stream, 0, -moveCursorPos);

    const line = this.#lineToRender(spinnerSymbol);
    readline.clearLine(this.stream, 0);
    this.stream.write(line);
    readline.moveCursor(this.stream, -(stringLength(line)), moveCursorPos);
  }

  start(text?: string, options: StartOptions = {}) {
    this.#started = true;
    this.text = text;
    if (typeof options.withPrefix === "string") {
      this.#prefix = options.withPrefix;
    }

    this.emit("start");
    this.#spinnerPos = internalSpinnerCount++;
    this.#startTime = performance.now();

    if (!this.#verbose) {
      return this;
    }

    this.#frameIndex = 0;
    this.stream.write(this.#lineToRender() + "\n");
    this.#interval = setInterval(
      () => this.#renderLine(),
      this.#spinner.interval
    );

    return this;
  }

  #stop(text?: string) {
    this.text = text;
    this.#started = false;

    if (this.#interval !== null) {
      clearInterval(this.#interval);
    }
  }

  succeed(text?: string) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(kLogSymbols.success);
      this.emit("succeed");
    }

    return this;
  }

  failed(text?: string) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(kLogSymbols.error);
      this.emit("failed");
    }

    return this;
  }
}

/**
 * @note code copy-pasted from https://github.com/chalk/ansi-regex#readme
 */
function ansiRegex() {
  // Valid string terminator sequences are BEL, ESC\, and 0x9c
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
  ].join("|");

  return new RegExp(pattern, "g");
}
