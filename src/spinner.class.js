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
const DEFAULT_SPINNER = "line";

// Symbol
const symSpinner = Symbol("spinner");
const symPrefixText = Symbol("prefixText");
const symText = Symbol("text");
const symColor = Symbol("color");

/**
 * @class Spinner
 *
 * @property {String} prefixText Spinner prefix text
 * @property {String} text Spinner text
 * @property {SafeEmitter} emitter Emitter
 * @property {Boolean} started Spinner is started
 * @property {Stream} stream Spinner TTY stream
 * @property {Number} frameIndex Spinner frameIndex
 */
class Spinner {
    /**
     * @constructor
     * @memberof #Spinner
     * @param {Object} options options
     * @param {Object|String} options.spinner Object for custom or string to get from cli-spinner
     * @param {String[]} options.spinner.frames String array of differente spinner frames
     * @param {Number} options.spinner.interval Interval between each frames in ms
     * @param {String} options.prefixText String spinner prefix text to display
     * @param {String} options.text Spinner text to display
     */
    constructor(options = Object.create(null)) {
        this.emitter = new SafeEmitter();
        this.spinner = options.spinner;
        this.prefixText = options.prefixText;
        this.text = is.string(options.text) ? options.text : "";
        this.color = options.color;
        this.started = false;

        this.stream = process.stdout;
        this.emitter.once("start").then(() => {
            this.spinnerPos = Spinner.count;
            Spinner.count++;
        });
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value Spinner text
     */
    set text(value) {
        if (!is.string(value)) {
            throw new TypeError("text must be a type of string");
        }
        this[symText] = value;
    }

    /**
     *
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
     *
     */
    get prefixText() {
        return this[symPrefixText];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value Spinner color
     */
    set color(value) {
        if (!is.string(value) && !is.nullOrUndefined(value)) {
            throw new TypeError("Color must be a type of string or undefined");
        }
        this[symColor] = value;
    }

    /**
     *
     */
    get color() {
        return this[symColor];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {Object|String} value text value
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
                /* eslint-disable max-len */
                throw new Error(`There is no built-in spinner named '${value}'. See "cli-spinners" from sindresorhus for a full list.`);
            }
        }
        else if (process.platform === "win32") {
            this[symSpinner] = cliSpinners[DEFAULT_SPINNER];
        }
        else if (is.nullOrUndefined(value)) {
            this[symSpinner] = cliSpinners.dots;
        }
        else {
            throw new TypeError("spinner must be a type of string|object|undefined");
        }
        this.frameIndex = 0;
    }

    /**
     *
     */
    get spinner() {
        return this[symSpinner];
    }

    /**
     * @method lineToRender
     * @memberof Spinner#
     * @param {Object} options options
     *
     * @return {String}
     */
    lineToRender(options = Object.create(null)) {
        const terminalCol = this.stream.columns;
        let frame;
        if (is.nullOrUndefined(options.symbol)) {
            const { frames } = this.spinner;
            frame = frames[this.frameIndex];
            this.frameIndex = ++this.frameIndex < frames.length ? this.frameIndex : 0;
        }
        else {
            frame = options.symbol;
        }

        if (!is.nullOrUndefined(this.color)) {
            frame = kleur[this.color](frame);
        }

        const defaultRaw = `${frame} ${this.prefixText}${this.text}`;
        this.prifexText = `${wcwidth(stripAnsi(defaultRaw))}:${wcwidth(defaultRaw)}`;

        let regFind = true;
        let regexArray = [];
        let count = 0;
        while (regFind) {
            const sliced = defaultRaw.slice(0, terminalCol);
            regexArray = sliced.match(ansiRegex()) || [];
            if (regexArray.length === count) {
                regFind = false;
                break;
            }
            count = regexArray.length;
        }

        for (const reg of regexArray) {
            count += reg.length;
        }

        return wcwidth(stripAnsi(defaultRaw)) > terminalCol ? `${defaultRaw.slice(0, terminalCol + count + 1)}\x1B[0m` : defaultRaw;
    }

    /**
     * @method renderLine
     * @memberof Spinner#
     * @param {Object} options options
     *
     * @return {void}
     */
    renderLine(options) {
        const moveCursorPos = Spinner.count - this.spinnerPos;
        this.stream.moveCursor(0, -moveCursorPos);

        const line = this.lineToRender(options);
        this.stream.clearLine();
        this.stream.write(line);

        this.stream.moveCursor(-line.length, moveCursorPos);
    }

    /**
     * @method start
     * @memberof Spinner#
     * @param {String} text text
     *
     * @return {void}
     */
    start(text) {
        if (!is.nullOrUndefined(text)) {
            this[symText] = text;
        }
        this.started = true;
        cliCursor.hide();

        this.emitter.emit("start");

        setImmediate(() => {
            Spinner.emitter.emit("start");
        });

        this.frameIndex = 0;
        console.log(this.lineToRender());
        this.interval = setInterval(this.renderLine.bind(this), this.spinner.interval);

        return this;
    }

    /**
     * @method start
     * @memberof Spinner#
     * @param {String} text Spinner text
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

        clearInterval(this.interval);
    }

    /**
     * @method succeed
     * @memberof Spinner#
     * @param {String} text Spinner text
     *
     * @return {void}
     */
    succeed(text) {
        this.stop(text);
        this.renderLine({ symbol: logSymbols.success, text });
        Spinner.emitter.emit("succeed");
    }

    /**
     * @method failed
     * @memberof Spinner#
     * @param {String} text Spinner text
     *
     * @return {void}
     */
    failed(text) {
        this.stop(text);
        this.renderLine({ symbol: logSymbols.error, text });
        Spinner.emitter.emit("failed");
    }
}

Spinner.count = 0;
Spinner.emitter = new SafeEmitter();

module.exports = Spinner;
