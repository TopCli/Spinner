// Import Node.js Dependencies
import { EventEmitter } from "node:events";
import { performance } from "node:perf_hooks";
import readline from "node:readline";

// Import Third-party Dependencies
import cliSpinners from "cli-spinners";
import stripAnsi from "strip-ansi";
import ansiRegex from "ansi-regex";
import wcwidth from "@topcli/wcwidth";
import kleur from "kleur";

// Import Internal Dependencies
import logSymbols from "./src/logSymbols.js";
import * as utils from "./src/utils.js";

// VARS
let internalSpinnerCount = 0;

// CONSTANTS
const kDefaultSpinnerName = "dots";

export class Spinner extends EventEmitter {
  static reset() {
    internalSpinnerCount = 0;
  }

  #started = false;
  #spinner = "dots";
  #text = "";
  #prefix = "";
  #color = undefined;

  #interval;
  #frameIndex = 0;
  #startTime;

  constructor(options = Object.create(null)) {
    super();

    this.verbose = options?.verbose ?? true;
    if (!this.verbose) {
      return;
    }

    const { text, prefix = "", spinner, color = "white" } = options;

    this.spinner = spinner;
    this.#prefix = prefix;
    if (typeof text === "string") {
      this.text = text;
    }
    this.#setSpinnerColor(color);
    this.stream = process.stdout;
    this.#started = false;

    this.once("start", () => {
      this.spinnerPos = internalSpinnerCount++;
    });
  }

  get started() {
    return this.#started;
  }

  get elapsedTime() {
    return performance.now() - this.#startTime;
  }

  get startTime() {
    return this.#startTime;
  }

  set text(value) {
    if (typeof value !== "string") {
      throw new TypeError("text must be a type of string");
    }
    this.#text = utils.cleanLineFeed(value);
  }

  get text() {
    return this.#text;
  }

  #setSpinnerColor(colorName) {
    if (typeof colorName !== "string") {
      throw new TypeError("Color must be a type of string or undefined");
    }
    if (!(colorName in kleur)) {
      throw new Error(`Unknown kleur color with name '${colorName}'`);
    }
    this.#color = kleur[colorName];
  }

  get color() {
    return this.#color;
  }

  set spinner(value) {
    if (typeof value == "object" && value !== null) {
      this.#spinner = utils.assertSpinnerFrame(value);
    }
    else if (typeof value === "string") {
      if (!(value in cliSpinners)) {
        throw new Error(
          `There is no built-in spinner named '${value}'. See "cli-spinners" package for a complete list.`
        );
      }
      this.#spinner = cliSpinners[value];
    }
    else {
      this.#spinner = cliSpinners[kDefaultSpinnerName];
    }
    this.#frameIndex = 0;
  }

  get spinner() {
    return this.#spinner;
  }

  #getSpinnerFrame(spinnerSymbol) {
    if (typeof spinnerSymbol === "string") {
      return spinnerSymbol;
    }

    const { frames } = this.spinner;
    const frame = frames[this.#frameIndex];
    this.#frameIndex = ++this.#frameIndex < frames.length ? this.#frameIndex : 0;

    return this.#color(frame);
  }

  #lineToRender(spinnerSymbol) {
    const terminalCol = this.stream.columns;
    const defaultRaw = `${this.#getSpinnerFrame(spinnerSymbol)} ${this.#prefix}${this.text}`;

    let regexArray = [];
    let count = 0;
    while (1) {
      const sliced = defaultRaw.slice(0, terminalCol + count);
      regexArray = sliced.match(ansiRegex()) ?? [];
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

  #renderLine(symbol) {
    if (!this.verbose) {
      return;
    }

    const moveCursorPos = internalSpinnerCount - this.spinnerPos;
    readline.moveCursor(this.stream, 0, -moveCursorPos);

    const line = this.#lineToRender(symbol);
    readline.clearLine(this.stream);
    this.stream.write(line);
    readline.moveCursor(this.stream, -line.length, moveCursorPos);
  }

  start(text) {
    this.#started = true;
    this.#startTime = performance.now();
    if (typeof text === "string") {
      this.text = text;
    }
    this.emit("start");

    if (!this.verbose) {
      return this;
    }

    this.#frameIndex = 0;
    console.log(this.#lineToRender());
    this.#interval = setInterval(
      () => this.#renderLine(),
      this.spinner.interval
    );

    return this;
  }

  #stop(text) {
    if (typeof text === "string") {
      this.text = text;
    }

    this.#started = false;
    if (this.#interval) {
      clearInterval(this.#interval);
    }
  }

  succeed(text) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(logSymbols.success);
      this.emit("succeed");
    }

    return this;
  }

  failed(text) {
    if (this.#started) {
      this.#stop(text);
      this.#renderLine(logSymbols.error);
      this.emit("failed");
    }

    return this;
  }
}
