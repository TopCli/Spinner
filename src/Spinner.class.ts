// Import Node.js Dependencies
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import readline from "node:readline";
import * as TTY from "node:tty";

// Import Third-party Dependencies
import cliSpinners from "cli-spinners";
import stripAnsi from "strip-ansi";
import ansiRegex from "ansi-regex";
import wcwidth from "@topcli/wcwidth";
import kleur from "kleur";

// Import Internal Dependencies
import logSymbols from "./logSymbols.js";
import * as utils from "./utils.js";

// VARS
let internalSpinnerCount = 0;

// CONSTANTS
const kDefaultSpinnerName = "dots" satisfies cliSpinners.SpinnerName;

export interface ISpinnerOptions {
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
  color?: string;
  /**
   * Do not log anything when disabled
   *
   * @default true
   */
  verbose?: boolean;
}

export interface IStartOptions {
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

  #interval: NodeJS.Timer | null = null;
  #frameIndex = 0;
  #spinnerPos = 0;
  #startTime: number;

  constructor(options: ISpinnerOptions = {}) {
    super();
    this.#verbose = options.verbose ?? true;
    if (!this.#verbose) {
      return;
    }

    const { name = kDefaultSpinnerName, color = null } = options;

    this.#spinner = name in cliSpinners ? cliSpinners[name] : cliSpinners[kDefaultSpinnerName];
    if (color === null) {
      this.#color = (str: string) => str;
    }
    else {
      this.#color = color in kleur ? kleur[color] : kleur.white;
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

  get color() {
    return this.#color;
  }

  set text(value: string | undefined) {
    if (typeof value == "string") {
      this.#text = utils.cleanLineFeed(value);
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

    let regexArray: any[] = [];
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
    count += regexArray.reduce((prev, curr) => prev + wcwidth(curr), 0);

    return wcwidth(stripAnsi(defaultRaw)) > terminalCol ?
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
    readline.moveCursor(this.stream, -line.length, moveCursorPos);
  }

  start(text?: string, options: IStartOptions = {}) {
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
      this.#renderLine(logSymbols.success);
      this.emit("succeed");
    }

    return this;
  }

  failed(text?: string) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(logSymbols.error);
      this.emit("failed");
    }

    return this;
  }
}
