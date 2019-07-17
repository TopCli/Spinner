// Require Node.js Dependencies
const { promisify } = require("util");

// Require Third-party Dependencies
const SafeEmitter = require("@slimio/safe-emitter");
const is = require("@slimio/is");
const cliSpinners = require("cli-spinners");
const logSymbols = require("log-symbols");
const cliCursor = require("cli-cursor");
const stripAnsi = require("strip-ansi");
const ansiRegex = require("ansi-regex");
const wcwidth = require("wcwidth");
const kleur = require("kleur");

// CONSTANT
const DEFAULT_WIN_SPINNER = "line";
const LINE_JUMP = 1;

// Symbol
const symSpinner = Symbol("spinner");
const symPrefixText = Symbol("prefixText");
const symText = Symbol("text");
const symColor = Symbol("color");

// Globals
const setImmediateAsync = promisify(setImmediate);

/**
 * @typedef {Object} SpinnerObj
 * @property {String[]} frames Array string frames of spinner
 * @property {number} interval interval between each frame
 */

/**
 * @class Spinner
 * @property {String} prefixText Spinner prefix text
 * @property {String} text Spinner text
 * @property {SafeEmitter} emitter Emitter
 * @property {Boolean} started Spinner is started
 * @property {Stream} stream Spinner TTY stream
 * @property {Number} frameIndex Spinner frameIndex
 * @property {String} color Spinner color
 */
class Spinner {
    /**
     * @constructor
     * @memberof #Spinner
     * @param {Object=} options options
     * @param {SpinnerObj|String} options.spinner Object for custom or string to get from cli-spinner
     * @param {String} options.prefixText String spinner prefix text to display
     * @param {String} options.text Spinner text to display
     * @param {String} options.color Spinner color to display
     * @param {Boolean} options.verbose Display spinner in console
     */
    constructor(options = Object.create(null)) {
        this.spinner = options.spinner;
        this.prefixText = options.prefixText;
        this.text = is.string(options.text) ? options.text : "";
        this.color = options.color;
        this.verbose = is.boolean(options.verbose) ? options.verbose : true;

        this.emitter = new SafeEmitter();
        this.stream = process.stdout;
        this.started = false;

        this.emitter.once("start").then(() => {
            this.spinnerPos = Spinner.count;
            Spinner.count++;
        }).catch(console.error);
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value Spinner text
     *
     * @throws {TypeError}
     */
    set text(value) {
        if (!is.string(value)) {
            throw new TypeError("text must be a type of string");
        }
        this[symText] = value;
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {String} text
     */
    get text() {
        return this[symText];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value Spinner prefix text
     */
    set prefixText(value) {
        this[symPrefixText] = is.string(value) ? `${value} - ` : "";
    }

    /**
     * @public
     * @memberof Spinner#
     * @member {String} prefixText
     */
    get prefixText() {
        return this[symPrefixText];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value Spinner color
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
     * @member {String} color
     */
    get color() {
        return this[symColor];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {Object|String} value text value
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
     * @member {Object} spinner
     */
    get spinner() {
        return this[symSpinner];
    }

    /**
     * @private
     * @method lineToRender
     * @memberof Spinner#
     * @param {String=} symbol Text symbol
     *
     * @return {String}
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

        let regFind = true;
        let regexArray = [];
        let count = 0;
        while (regFind) {
            const sliced = defaultRaw.slice(0, terminalCol + count);
            regexArray = sliced.match(ansiRegex()) || [];
            if (regexArray.length === count) {
                regFind = false;
                break;
            }
            count = regexArray.length;
        }

        for (const reg of regexArray) {
            count += wcwidth(reg);
        }

        if (wcwidth(stripAnsi(defaultRaw)) > terminalCol) {
            return `${defaultRaw.slice(0, terminalCol + count)}\x1B[0m`;
        }

        return defaultRaw;
    }

    /**
     * @private
     * @method renderLine
     * @memberof Spinner#
     * @param {String=} symbol Text symbol
     *
     * @return {void}
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
     * @method start
     * @memberof Spinner#
     * @param {String=} text text
     *
     * @return {void}
     */
    start(text) {
        if (!is.nullOrUndefined(text)) {
            this[symText] = text;
        }
        this.started = true;
        this.emitter.emit("start");
        setImmediate(() => Spinner.emitter.emit("start"));

        if (this.verbose === true) {
            this.frameIndex = 0;
            console.log(this.lineToRender());
            this.interval = setInterval(this.renderLine.bind(this), this.spinner.interval);
        }

        return this;
    }

    /**
     * @private
     * @method stop
     * @memberof Spinner#
     * @param {String=} text Spinner text
     *
     * @return {void}
     */
    stop(text) {
        if (this.started === false) {
            return;
        }

        if (!is.nullOrUndefined(text)) {
            this[symText] = text;
        }
        this.started = false;

        if (this.verbose === true) {
            clearInterval(this.interval);
        }
    }

    /**
     * @public
     * @method succeed
     * @memberof Spinner#
     * @param {String=} text Spinner text
     *
     * @return {void}
     */
    succeed(text) {
        this.stop(text);
        if (this.verbose === true) {
            this.renderLine(logSymbols.success);
        }
        Spinner.emitter.emit("succeed");
    }

    /**
     * @public
     * @method failed
     * @memberof Spinner#
     * @param {String=} text Spinner text
     *
     * @return {void}
     */
    failed(text) {
        this.stop(text);
        if (this.verbose === true) {
            this.renderLine(logSymbols.error);
        }
        Spinner.emitter.emit("failed");
    }
}


/**
 * @static
 * @memberof Spinner#
 * @method startAll
 * @param {!Function[]} array array
 * @param {Object=} options options
 * @param {Boolean} [options.recap=true] Write a recap in terminal
 * @param {Boolean} [options.rejects=true] Write all rejection in terminal
 *
 * @return {Promise<any[]>}
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

    const recapOpt = is.boolean(options.recap) ? options.recap : true;
    const rejectOpt = is.boolean(options.rejects) ? options.rejects : true;
    let [started, finished, failed] = [0, 0, 0];

    /**
     * @function writeRecap
     * @return {void}
     */
    function writeRecap() {
        const col = process.stdout.columns;
        const recap = `${finished} / ${functions.length} : with ${failed} failed`;
        const displayRecap = recap.length > col ? recap.slice(0, col) : recap;

        process.stdout.moveCursor(0, LINE_JUMP);
        process.stdout.clearLine();
        process.stdout.write(displayRecap);
        process.stdout.moveCursor(-displayRecap.length, -LINE_JUMP);
    }


    Spinner.emitter.on("start", () => {
        started++;
        if (started === functions.length && recapOpt === true) {
            console.log("\n".repeat(LINE_JUMP - 1));
            process.stdout.moveCursor(0, -LINE_JUMP);
            writeRecap();
        }
    });

    Spinner.emitter.on("succeed", () => {
        finished++;
        if (started === functions.length && recapOpt === true) {
            writeRecap();
        }
    });

    Spinner.emitter.on("failed", () => {
        finished++;
        failed++;

        if (started === functions.length && recapOpt === true) {
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
    if (recapOpt === true) {
        writeRecap();
        process.stdout.moveCursor(0, LINE_JUMP + 1);
    }

    if (rejectOpt === true && rejects.length > 0) {
        for (const reject of rejects) {
            console.error(`\n${reject.stack}`);
        }
    }
    cliCursor.show();
    Spinner.count = 0;

    return results;
};

/**
 * @static
 * @method create
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
Spinner.emitter = new SafeEmitter();
Object.preventExtensions(Spinner);

module.exports = Spinner;
