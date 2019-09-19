"use strict";
// Note: clean re-implementation of https://github.com/sindresorhus/log-symbols

// Require Third-party Dependency
const kleur = require("kleur");

if (process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color") {
    module.exports = {
        info: kleur.blue("ℹ"),
        success: kleur.green("✔"),
        warning: kleur.yellow("⚠"),
        error: kleur.red("✖")
    };
}
else {
    module.exports = {
        info: kleur.blue("i"),
        success: kleur.green("√"),
        warning: kleur.yellow("‼"),
        error: kleur.red("×")
    };
}
