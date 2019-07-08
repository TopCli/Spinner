# Async-cli-spinner
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/SlimIO/Async-cli-spinner/master/package.json?token=AOgWw3vrgQuu-U4fz1c7yYZyc7XJPNtrks5catjdwA%3D%3D&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)
![dep](https://img.shields.io/david/SlimIO/Async-cli-spinner.svg)
![size](https://img.shields.io/bundlephobia/min/@slimio/async-cli-spinner.svg)
[![Known Vulnerabilities](https://snyk.io//test/github/SlimIO/Async-cli-spinner/badge.svg?targetFile=package.json)](https://snyk.io//test/github/SlimIO/Async-cli-spinner?targetFile=package.json)
[![Build Status](https://travis-ci.com/SlimIO/Async-cli-spinner.svg?branch=master)](https://travis-ci.com/SlimIO/Async-cli-spinner)

Asynchronous CLI Spinner. This package has been created to handle simultaneous/multiple spinner at a time. The package has been inspired by [Ora](https://github.com/sindresorhus/ora) but in Asynchronous.

All available spinners are part of [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) package.

<p align="center">
<img src="https://github.com/SlimIO/Governance/blob/master/docs/images/cli_init.gif">
</p>

## Requirements
- [Node.js](https://nodejs.org/en/) v11 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @slimio/async-cli-spinner
# or
$ yarn add @slimio/async-cli-spinner
```

## Usage example
```js
const Spinner = require("@slimio/async-cli-spinner");

async function fnWithSpinner(prefixText) {
    const spinner = new Spinner({ prefixText }).start("Start working!");

    await new Promise((resolve) => setTimeout(resolve, 500));
    spinner.text = "Work in progress...";

    await new Promise((resolve) => setTimeout(resolve, 500));
    spinner.succeed("All done !");
}

Spinner.startAll([
    fnWithSpinner,
    Spinner.create(fnWithSpinner),
    Spinner.create(fnWithSpinner, "Item 1"),
    Spinner.create(fnWithSpinner, "Item 2")
])
    .then(() => console.log("All spinners finished!"))
    .catch(console.error);
```

## API

<details><summary>constructor(options?: Spinner.options)</summary>
<br>
Create a new Spinner object.

Options is described by the following TypeScript interface :
```ts
declare namespace Spinner {
    interface spinnerObj {
        frames: string[];
        interval: number;
    }

    interface options {
        spinner: SpinnerObj | Spinner.spinners;
        text: string;
        prefixText: string;
        color: string;
        verbose: boolean;
    }
}
```

> 👀 Look [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) for all kind of available spinners.

Example:
```js
const Spinner = require("@slimio/async-cli-spinner");

const spinner = new Spinner();
const dotsSpinner = new Spinner({ spinner: "dots" });
```
</details>


<details><summary>static startAll(functions: Spinner.Handler[], options?: Spinner.startOpt): Promise&ltany[]&gt</summary>
<br>
Start all functions with spinners passed in array.

> ⚠️ Only accept functions that return a Promise.

Options is described by the following TypeScript interface:
```ts
declare namespace Spinner {
    interface startOpt {
        recap: true;
        rejects: true;
    }
}
```
</details>

<details><summary>static create(fn: Spinner.Handler, args?: any): Function|[Function, ...any]</summary>
<br>
This method allow to pass arguments to our spinner function. This method prevent execute function before some throw errors.
</details>

-------------------------------------------------

<details><summary>start(text?: string): Spinner</summary>
Start the spinner in the CLI and write the text passed in param.
</details>

<details><summary>succeed(text?: string): void</summary>
Stop the spinner in the CLI, write the text passed in param and mark it as succeed with a symbol.
</details>

<details><summary>failed(text?: string): void</summary>
Stop the spinner in the CLI, write the text passed in param and mark it as failed with a symbol.
</details>
<br>

> ⚠️ Functions **start()**, **succeed()** and **failed()** are supposed to be executed in a function which return a promise and will be called by Spinner.startAll().

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[@slimio/is](https://github.com/SlimIO/is#readme)|Minor|Low|Type checker|
|[@slimio/safe-emitter](https://github.com/SlimIO/safeEmitter#readme)|Minor|Low|Safe emitter|
|[ansi-regex](https://github.com/chalk/ansi-regex#readme)|Minor|Low|Get ANSI code|
|[cli-cursor](https://github.com/sindresorhus/cli-cursor#readme)|⚠️Major|High|Show/Hide CLI cursor|
|[cli-spinners](https://github.com/sindresorhus/cli-spinners#readme)|Minor|Low|Bunch of spinner|
|[kleur](https://github.com/lukeed/kleur#readme)|Minor|Low|CLI color|
|[log-symbols](https://github.com/sindresorhus/log-symbols#readme)|Minor|Low|Symbol for CLI|
|[strip-ansi](https://github.com/chalk/strip-ansi#readme)|Minor|Low|ANSI escape codes|
|[wcwidth](https://github.com/timoxley/wcwidth#readme)|⚠️Major|Low|Get CLI columns for special characters|

## License
MIT
