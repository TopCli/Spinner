"use strict";

// Note: clean re-implementation of https://github.com/sindresorhus/log-symbols

// Require Third-party Dependency
const kleur = require("kleur");

// CONSTANTS
const IS_SUPPORTED = process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color";

const main = {
    info: kleur.blue("ℹ"),
    success: kleur.green("✔"),
    warning: kleur.yellow("⚠"),
    error: kleur.red("✖")
};

const fallbacks = {
    info: kleur.blue("i"),
    success: kleur.green("√"),
    warning: kleur.yellow("‼"),
    error: kleur.red("×")
};

module.exports = IS_SUPPORTED ? main : fallbacks;
