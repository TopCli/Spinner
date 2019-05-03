// Require Third-party Dependencies
const is = require("@slimio/is");
const cliSpinners = require("cli-spinners");
const SafeEmitter = require("@slimio/safe-emitter");

// CONSTANT
const DEFAULT_SPINNER = "dots";

const SPINNER = Symbol("spinner");
const PREFIX_TEXT = Symbol("prefixText");
const TEXT = Symbol("text");

/**
 * @class Spinner
 *
 * @property {String} prefixText
 */
class Spinner {
    /**
     * @constructor
     * @memberof #Spinner
     * @param {Object} options options
     */
    constructor(options = Object.create(null)) {
        this.emitter = new SafeEmitter();
        this.spinner = options.spinner;
        this.prefixText = options.prefixText;
        this.text = is.string(options.text) ? options.text : "";
        this.started = false;

        this.stream = process.stdout;
        this.emitter.once("start").then(() => {
            this.spinnerPos = Spinner.count;
            Spinner.count++;

            return void 0;
        });
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value text value
     */
    set text(value) {
        if (!is.string(value)) {
            throw new TypeError("text must be a type of string");
        }
        this[TEXT] = value;
    }

    /**
     *
     */
    get text() {
        return this[TEXT];
    }

    /**
     * @public
     * @memberof Spinner#
     * @param {String} value prefixText value
     */
    set prefixText(value) {
        this[PREFIX_TEXT] = is.string(value) ? `${value} - ` : "";
    }

    /**
     *
     */
    get prefixText() {
        return this[PREFIX_TEXT];
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
            this[SPINNER] = value;
        }

        if (process.platform === "win32") {
            this[SPINNER] = cliSpinners[DEFAULT_SPINNER];
        }
        else if (is.nullOrUndefined(value)) {
            this[SPINNER] = cliSpinners.dots;
        }
        else if (is.string(value)) {
            if (cliSpinners[value]) {
                this[SPINNER] = cliSpinners[value];
            }
            else {
                throw new Error(`There is no built-in spinner named '${value}'. See "cli-spinners" from sindresorhus for a full list.`);
            }
        }
        else {
            throw new TypeError("spinner must be a type of string|object|undefined");
        }
    }

    /**
     *
     */
    get spinner() {
        return this[SPINNER];
    }

    /**
     *
     * @param {Number} frameIndex frameIndex
     *
     * @return {String}
     */
    renderLine() {
        const terminalCol = this.stream.columns;

        const { frames } = this.spinner;
        const frame = frames[this.frameIndex];
        this.frameIndex = ++this.frameIndex < frames.length ? this.frameIndex : 0;

        const defaultRaw = `${frame} ${this.prefixText}${this.text}`;
        const displayRaw = defaultRaw.length > terminalCol ? defaultRaw.slice(0, terminalCol) : defaultRaw;

        return displayRaw;
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
            this[TEXT] = text;
        }
        this.started = true;

        this.emitter.emit("start");
        Spinner.emitter.emit("start");

        this.frameIndex = 0;
        console.log(this.renderLine());
        this.interval = setInterval(() => {
            // move terminal cursor to line
            const moveCursorPos = Spinner.count - this.spinnerPos;
            this.stream.moveCursor(0, -moveCursorPos);
            this.stream.clearLine();

            const line = this.renderLine();
            this.stream.write(line);
            this.stream.moveCursor(-line.length, 0);

            // move terminal cursor to the end
            this.stream.moveCursor(0, moveCursorPos);
        }, this.spinner.interval);

        return this;
    }

    /**
     * @method succeed
     * @memberof Spinner#
     * @param {String} text text
     *
     * @return {void}
     */
    succeed(text = "Success") {
        if (this.started === false) {
            return;
        }

        if (!is.nullOrUndefined(text)) {
            this[TEXT] = text;
        }
        clearInterval(this.interval);
        Spinner.emitter.emit("success", this);
    }

    /**
     * @method fail
     * @memberof Spinner#
     * @param {String} text text
     *
     * @return {void}
     */
    fail(text = "Fail") {
        if (this.started === false) {
            return;
        }
        if (!is.nullOrUndefined(text)) {
            this[TEXT] = text;
        }
        clearInterval(this.interval);
        Spinner.emitter.emit("fail", this);
    }
}

Spinner.count = 0;
Spinner.emitter = new SafeEmitter();

module.exports = Spinner;
