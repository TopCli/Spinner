// Require internal Dependencies
const Spinner = require("./src/spinner.class.js");

// Require Third-party Dependencies
const is = require("@slimio/is");
const cliCursor = require("cli-cursor");

// CONSTANT
const LINE_JUMP = 1;

async function startAll(array, options = Object.create(null)) {
    const recapOpt = is.boolean(options.recap) ? options.recap : true;
    const rejectOpt = is.boolean(options.rejects) ? options.rejects : true;

    let started = 0;
    let finished = 0;
    let succeed = 0;
    let failed = 0;


    function writeRecap() {
        const col = process.stdout.columns;
        const recap = `${finished} / ${array.length} : with ${failed} failed`;
        const displayRecap = recap.length > col ? recap.slice(0, col) : recap;

        process.stdout.moveCursor(0, LINE_JUMP);
        process.stdout.clearLine();
        process.stdout.write(displayRecap);
        process.stdout.moveCursor(-displayRecap.length, -LINE_JUMP);
    }


    Spinner.emitter.on("start", () => {
        started++;
        if (started === array.length && recapOpt === true) {
            for (let ind = 1; ind <= LINE_JUMP; ind++) {
                console.log();
            }
            process.stdout.moveCursor(0, -LINE_JUMP);
            writeRecap();
        }
    });

    Spinner.emitter.on("succeed", () => {
        finished++;
        succeed++;

        if (started === array.length && recapOpt === true) {
            writeRecap();
        }
    });

    Spinner.emitter.on("failed", () => {
        finished++;
        failed++;

        if (started === array.length && recapOpt === true) {
            writeRecap();
        }
    });

    const rejects = [];
    const results = await Promise.all(
        array.map((promise) => promise.catch((err) => rejects.push(err)))
    );

    setImmediate(() => {
        if (recapOpt === true) {
            writeRecap();
            process.stdout.moveCursor(0, LINE_JUMP + 2);
        }

        if (rejectOpt === true) {
            process.stdout.moveCursor(0, 2);
            for (const reject of rejects) {
                console.error(`${reject.stack}\n`);
            }
        }
        cliCursor.show();
        Spinner.count = 0;

        return results;
    });
}

module.exports = {
    startAll,
    Spinner
};
