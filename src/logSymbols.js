// Note: clean re-implementation of https://github.com/sindresorhus/log-symbols

// Import Third-party Dependency
import kleur from "kleur";

let config;

if (process.platform !== "win32" || process.env.CI || process.env.TERM === "xterm-256color") {
  config = {
    info: kleur.blue("ℹ"),
    success: kleur.green("✔"),
    warning: kleur.yellow("⚠"),
    error: kleur.red("✖")
  };
}
else {
  config = {
    info: kleur.blue("i"),
    success: kleur.green("√"),
    warning: kleur.yellow("‼"),
    error: kleur.red("×")
  };
}

export default config;
