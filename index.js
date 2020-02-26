"use strict";

// Require Node.js Dependencies
const { promisify } = require("util");
const { EventEmitter, once } = require("events");
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const is = require("@slimio/is");
const cliSpinners = require("cli-spinners");
const cliCursor = require("cli-cursor");
const stripAnsi = require("strip-ansi");
const ansiRegex = require("ansi-regex");
const wcwidth = require("@slimio/wcwidth");
const kleur = require("kleur");

// Require Internal Dependencies
const logSymbols = require("./src/logSymbols");

// CONSTANT
const DEFAULT_WIN_SPINNER = "line";
const LINE_JUMP = 1;
const recapSetOpt = new Set(["none", "error", "always"]);

// Symbol
const symSpinner = Symbol("spinner");
const symPrefixText = Symbol("prefixText");
const symText = Symbol("text");
const symColor = Symbol("color");

// Globals
const setImmediateAsync = promisify(setImmediate);

/**
 * @typedef {object} SpinnerObj
 * @property {string[]} frames Array string frames of spinner
 * @property {number} interval interval between each frame
 */

class Spinner {
    /**
     * @class Spinner
     * @memberof Spinner#
     * @param {object} [options] options
     * @param {SpinnerObj|string} options.spinner Object for custom or string to get from cli-spinner
     * @param {string} options.prefixText String spinner prefix text to display
     * @param {string} options.text Spinner text to display
     * @param {string} options.color Spinner color to display
     * @param {boolean} options.verbose Display spinner in console
     */
    constructor(options = Object.create(null)) {
        this.verbose = is.boolean(options.verbose) ? options.verbose : true;
        this.startTime = performance.now();
        if (!this.verbose) {
            return;
        }

        this.spinner = options.spinner;
        this.prefixText = options.prefixText;
        this.text = is.string(options.text) ? options.text : "";
        this.color = options.color;
        this.emitter = new EventEmitter();
        this.stream = process.stdout;
        this.started = false;

        once(this.emitter, "start").then(() => {
            this.spinnerPos = Spinner.count;
            Spinner.count++;
        }).catch(console.error);
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {number} elapsedTime
     * @returns {number}
     */
    get elapsedTime() {
        return performance.now() - this.startTime;
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {string} value Spinner text
     *
     * @throws {TypeError}
     */
    set text(value) {
        if (!is.string(value)) {
            throw new TypeError("text must be a type of string");
        }
        this[symText] = value.replace(/\r?\n|\r/, "");
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {string} text
     * @returns {string}
     */
    get text() {
        return this[symText];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {string} value Spinner prefix text
     */
    set prefixText(value) {
        this[symPrefixText] = is.string(value) ? `${value.replace(/\r?\n|\r/, "")} - ` : "";
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {string} prefixText
     * @returns {string}
     */
    get prefixText() {
        return this[symPrefixText];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {string} value Spinner color
     *
     * @throws {TypeError}
     */
    set color(value) {
        if (!is.string(value) && !is.nullOrUndefined(value)) {
            throw new TypeError("Color must be a type of string or undefined");
        }
        this[symColor] = value;
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {string} color
     * @returns {string}
     */
    get color() {
        return this[symColor];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {object|string} value text value
     *
     * @throws {TypeError}
     */
    set spinner(value) {
        if (is.plainObject(value)) {
            if (is.nullOrUndefined(value.frames)) {
                throw new Error("Spinner object must have a frames property");
            }
            if (is.nullOrUndefined(value.interval)) {
                throw new Error("Spinner object must have an interval property");
            }
            this[symSpinner] = value;
        }
        else if (is.string(value)) {
            if (cliSpinners[value]) {
                this[symSpinner] = cliSpinners[value];
            }
            else {
                /* eslint-disable-next-line max-len */
                throw new Error(`There is no built-in spinner named '${value}'. See "cli-spinners" from sindresorhus for a full list.`);
            }
        }
        // else if (process.platform === "win32") {
        //     this[symSpinner] = cliSpinners[DEFAULT_WIN_SPINNER];
        // }
        else if (is.nullOrUndefined(value)) {
            this[symSpinner] = cliSpinners[Spinner.DEFAULT_SPINNER];
        }
        else {
            throw new TypeError("spinner must be a type of string|object|undefined");
        }
        this.frameIndex = 0;
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {object} spinner
     * @returns {object}
     */
    get spinner() {
        return this[symSpinner];
    }

    /**
     * @private
     * @function lineToRender
     * @memberof Spinner#
     * @param {string} [symbol] Text symbol
     *
     * @returns {string}
     */
    lineToRender(symbol) {
        const terminalCol = this.stream.columns;
        let frame;
        if (is.nullOrUndefined(symbol)) {
            const { frames } = this.spinner;
            frame = frames[this.frameIndex];
            this.frameIndex = ++this.frameIndex < frames.length ? this.frameIndex : 0;
        }
        else {
            frame = symbol;
        }

        if (!is.nullOrUndefined(this.color)) {
            frame = kleur[this.color](frame);
        }
        const defaultRaw = `${frame} ${this.prefixText}${this.text}`;

        let regexArray = [];
        let count = 0;
        while (1) {
            const sliced = defaultRaw.slice(0, terminalCol + count);
            regexArray = sliced.match(ansiRegex()) || [];
            if (regexArray.length === count) {
                break;
            }
            count = regexArray.length;
        }
        count += regexArray.reduce((prev, curr) => prev + wcwidth(curr), 0);

        if (wcwidth(stripAnsi(defaultRaw)) > terminalCol) {
            return `${defaultRaw.slice(0, terminalCol + count)}\x1B[0m`;
        }

        return defaultRaw;
    }

    /**
     * @private
     * @function renderLine
     * @memberof Spinner#
     * @param {string} [symbol] Text symbol
     *
     * @returns {void}
     */
    renderLine(symbol) {
        const moveCursorPos = Spinner.count - this.spinnerPos;
        this.stream.moveCursor(0, -moveCursorPos);

        const line = this.lineToRender(symbol);
        this.stream.clearLine();
        this.stream.write(line);
        this.stream.moveCursor(-line.length, moveCursorPos);
    }

    /**
     * @public
     * @function start
     * @memberof Spinner#
     * @param {string} [text] text
     *
     * @returns {void}
     */
    start(text) {
        if (!this.verbose) {
            return this;
        }
        if (!is.nullOrUndefined(text)) {
            this.text = text;
        }
        this.started = true;
        this.startTime = performance.now();
        this.emitter.emit("start");
        setImmediate(() => Spinner.emitter.emit("start"));

        this.frameIndex = 0;
        console.log(this.lineToRender());
        this.interval = setInterval(this.renderLine.bind(this), this.spinner.interval);

        return this;
    }

    /**
     * @private
     * @function stop
     * @memberof Spinner#
     * @param {string} [text] Spinner text
     *
     * @returns {void}
     */
    stop(text) {
        if (!this.verbose || this.started === false) {
            return;
        }

        if (!is.nullOrUndefined(text)) {
            this.text = text;
        }
        this.started = false;
        clearInterval(this.interval);
    }

    /**
     * @public
     * @function succeed
     * @memberof Spinner#
     * @param {string} [text] Spinner text
     *
     * @returns {void}
     */
    succeed(text) {
        if (!this.verbose) {
            return;
        }

        this.stop(text);
        this.renderLine(logSymbols.success);
        Spinner.emitter.emit("succeed");
    }

    /**
     * @public
     * @function failed
     * @memberof Spinner#
     * @param {string} [text] Spinner text
     *
     * @returns {void}
     */
    failed(text) {
        if (!this.verbose) {
            return;
        }

        this.stop(text);
        this.renderLine(logSymbols.error);
        Spinner.emitter.emit("failed");
    }
}


/**
 * @static
 * @memberof Spinner#
 * @function startAll
 * @param {Function[]} array array
 * @param {object} [options] options
 * @param {boolean} [options.recap=true] Write a recap in terminal
 * @param {boolean} [options.rejects=true] Write all rejection in terminal
 *
 * @returns {Promise<any[]>}
 */
/* eslint-disable-next-line func-names*/
Spinner.startAll = async function(functions, options = Object.create(null)) {
    if (!is.array(functions)) {
        throw new TypeError("functions param must be a type of <array>");
    }

    for (const elem of functions) {
        if (is.array(elem)) {
            const [fn] = elem;
            if (!is.asyncFunction(fn)) {
                throw new TypeError("The first item of an array in startAll() functions param must be a type of <Function>");
            }

            continue;
        }
        if (!is.asyncFunction(elem)) {
            throw new TypeError("Item startAll() functions param must be a type of <Function>");
        }
    }

    if (!is.nullOrUndefined(options.recap) && !recapSetOpt.has(options.recap)) {
        throw new Error(`recap option must be ${[...recapSetOpt].join("|")}`);
    }

    const recapOpt = recapSetOpt.has(options.recap) ? options.recap : "always";
    const rejectOpt = is.boolean(options.rejects) ? options.rejects : true;
    let recap = recapOpt === "always";
    let [started, finished, failed] = [0, 0, 0];

    /**
     * @function writeRecap
     * @returns {void}
     */
    function writeRecap() {
        const col = process.stdout.columns;
        const recapStr = `${finished} / ${functions.length} : with ${failed} failed`;
        const displayRecap = recapStr.length > col ? recapStr.slice(0, col) : recapStr;

        process.stdout.moveCursor(0, LINE_JUMP);
        process.stdout.clearLine();
        process.stdout.write(displayRecap);
        process.stdout.moveCursor(-displayRecap.length, -LINE_JUMP);
    }


    Spinner.emitter.on("start", () => {
        started++;
        if (started === functions.length && recap === true) {
            console.log("\n".repeat(LINE_JUMP - 1));
            process.stdout.moveCursor(0, -LINE_JUMP);
            writeRecap();
        }
    });

    Spinner.emitter.on("succeed", () => {
        finished++;
        if (started === functions.length && recap === true) {
            writeRecap();
        }
    });

    Spinner.emitter.on("failed", () => {
        finished++;
        failed++;
        recap = recapOpt === "error" || recapOpt === "always";
        if (started === functions.length && recap === true) {
            writeRecap();
        }
    });

    cliCursor.hide();
    const rejects = [];
    const results = await Promise.all(
        functions.map((promise) => {
            if (is.array(promise)) {
                const [fn, ...args] = promise;

                return fn(...args).catch((err) => rejects.push(err));
            }

            return promise().catch((err) => rejects.push(err));
        })
    );

    await setImmediateAsync();
    if (recap === true) {
        writeRecap();
        process.stdout.moveCursor(0, LINE_JUMP + 1);
    }

    if (rejectOpt === true && rejects.length > 0) {
        for (const reject of rejects) {
            console.error(`\n${reject.stack}`);
        }
    }
    cliCursor.show();
    // eslint-disable-next-line
    Spinner.count = 0;

    return results;
};

/**
 * @static
 * @function create
 * @memberof Spinner#
 * @param {Function} fn Async function
 * @param {Array} args array of arguments for the async function
 * @returns {Array<any>}
 *
 * @throws {TypeError}
 */
/* eslint-disable-next-line func-names */
Spinner.create = function(fn, ...args) {
    if (!is.asyncFunction(fn)) {
        throw new TypeError("fn param must be an Asynchronous Function");
    }
    if (args.length > 0) {
        return [fn, ...args];
    }

    return fn;
};

Spinner.DEFAULT_SPINNER = "dots";
Spinner.count = 0;
Spinner.emitter = new EventEmitter();
Object.preventExtensions(Spinner);

module.exports = Spinner;
