const Spinner = require("./src/spinner.class.js");
const cliCursor = require("cli-cursor");

// CONSTANT
const LINE_JUMP = 1;

/* eslint-disable no-loop-func */
async function startAll(array) {
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
        if (started === array.length) {
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

        if (started === array.length) {
            writeRecap();
        }
    });

    Spinner.emitter.on("failed", () => {
        finished++;
        failed++;

        if (started === array.length) {
            writeRecap();
        }
    });

    const rejects = [];
    const results = await Promise.all(
        array.map((promise) => promise.catch((err) => rejects.push(err)))
    );

    setImmediate(() => {
        writeRecap();
        process.stdout.moveCursor(0, LINE_JUMP + 2);

        for (const reject of rejects) {
            console.error(`${reject.stack}\n`);
        }
        cliCursor.show();

        return results;
    });
}

module.exports = {
    startAll,
    Spinner
};
