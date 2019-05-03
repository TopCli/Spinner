const cliSpinners = require("cli-spinners");
const Spinner = require("./src/spinner.class.js");

/* eslint-disable no-loop-func */
async function startAll(array) {
    let started = 0;
    let finished = 0;
    let succeeded = 0;
    let failed = 0;
    function writeRecap() {
        const col = process.stdout.columns;
        const recap = `${finished} / ${array.length} : with ${failed} failed`;
        const displayRecap = recap.length > col ? recap.slice(0, col) : recap;
        process.stdout.moveCursor(0, 2);
        process.stdout.clearLine();
        process.stdout.write(displayRecap);
        process.stdout.moveCursor(-recap.length, -2);
    }

    Spinner.emitter.on("start", () => {
        started++;
        if (started === array.length) {
            writeRecap();
        }
    });
    Spinner.emitter.on("success", () => {
        finished++;
        succeeded++;
        writeRecap();

        if (finished === array.length) {
            process.stdout.moveCursor(0, 3);
        }
    });
    Spinner.emitter.on("fail", () => {
        finished++;
        failed++;
        writeRecap();

        if (finished === array.length) {
            process.stdout.moveCursor(0, 3);
        }
    });

    // console.log();
    // console.log(`${finished} / ${array.length}`);
    const results = await Promise.all(array);

    return results;
}

module.exports = {
    startAll,
    Spinner
};
