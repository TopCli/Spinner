# async-cli-spinner
![version](https://img.shields.io/badge/version-0.1.3-blue.svg)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)

Simultaneous async spinner for CLI

## Requirements
- Node.js v11 or higher

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

function fnWithSpinner(item){
    return new Promise((resolve) => {
        const spinner = new Spinner();
        spinner.prefixText = item;
        spinner.start("Started");

        setTimeout(() => {
            spinner.text = "working";
        }, 2000);

        setTimeout(() => {
            spinner.succeed("All done !");
            resolve();
        }, 3000);
    });
}

async function main() {
    await Spinner.startAll([
        fnWithSpinner,
        Spinner.create(fnWithSpinner),
        Spinner.create(fnWithSpinner, "Item 1"),
        Spinner.create(fnWithSpinner, "Item 2")
    ]);
}
main().catch(console.error);
```

## API

<details><summary>constructor(options?: Spinner.options)</summary>
<br>
Create a new Spinner object.

Options params :
```ts
declare namespace Spinner {
    interface spinnerObj {
        frames: string[];
        interval: number;
    }

    interface options {
        spinner: SpinnerObj|string;
        text: string;
        prefixText: string;
        color: string;
    }
}
```

Example:
```js
const Spinner = require("@slimio/async-cli-spinner");
const spinner = new Spinner();
```
</details>


<details><summary>static startAll(functions: Function[], options?: Spinner.startOpt)</summary>
<br>
Start all functions with spinners passed in array.

> Accept `async` and normal functions  
> If you use normal function, it must return a `Promise`

Options params :
```ts
declare namespace Spinner {
    interface startOpt {
        recap: true;
        rejects: true;
    }
}
```

Example:
```js
const Spinner = require("@slimio/async-cli-spinner");

function fnWithSpinner(){
    return new Promise((resolve) => {
        const spinner = new Spinner();
        spinner.start("Started");

        setTimeout(() => {
            spinner.text = "working";
        }, 2000);

        setTimeout(() => {
            spinner.succeed("All done !");
            resolve();
        }, 3000);
    });
}

async function main() {
    await Spinner.startAll([
        fnWithSpinner,
        fnWithSpinner,
        fnWithSpinner
    ]);
}
main().catch(console.error);
```
</details>

<details><summary>static created(fn: Function, args?: any)</summary>
<br>
This method allow to pass arguments to our spinner function. This method prevent execute function before some throw errors.

Example:
```js
const Spinner = require("@slimio/async-cli-spinner");

function fnWithSpinner(item){
    return new Promise((resolve) => {
        const spinner = new Spinner();
        spinner.prefixText = item;
        spinner.start("Started");

        setTimeout(() => {
            spinner.text = "working";
        }, 2000);

        setTimeout(() => {
            spinner.succeed("All done !");
            resolve();
        }, 3000);
    });
}

async function main() {
    await Spinner.startAll([
        Spinner.create(fnWithSpinner, "Item 1"),
        Spinner.create(fnWithSpinner, "Item 2"),
        Spinner.create(fnWithSpinner, "Item 3")
    ]);
}
main().catch(console.error);
```
</details>


<br>


<details><summary>start(text?: string)</summary>
Start the spinner in the CLI and write the text passed in param.
</details>

<details><summary>succeed(text?: string)</summary>
Stop the spinner in the CLI, write the text passed in param and mark it as succeed with a symbol.
</details>

<details><summary>failed(text?: string)</summary>
Stop the spinner in the CLI, write the text passed in param and mark it as failed with a symbol.
</details>
<br>

> Functions **start()**, **succeed()** and **failed()** are supposed to be executed in a function which return a promise and will be called by Spinner.startAll().

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
