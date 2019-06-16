# Async-cli-spinner
![version](https://img.shields.io/badge/version-0.1.3-blue.svg)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)

Asynchronous CLI Spinner. This package has been created to handle multiple spinner at a time.

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

Options params :
```ts
declare namespace Spinner {
    interface spinnerObj {
        frames: string[];
        interval: number;
    }

    interface options {
        spinner: SpinnerObj|Spinner.spinners;
        text: string;
        prefixText: string;
        color: string;
    }
}
```

> Look [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) for more details

|enum Spinner.spinners||||||
|---|---|---|---|---|---|
|"dots"|"dots2"|"dots3"|"dots4"|"dots5"|"dots6"|
|"dots7"|"dots8"|"dots9"|"dots10"|"dots11"|"dots12"|
|"line"|"line2"|"pipe"|"simpleDots"|"simpleDotsScrolling"|"star"|
|"star2"|"flip"|"hamburger"|"growVertical"|"growHorizontal"|"balloon"|
|"balloon2"|"noise"|"bounce"|"boxBounce"|"boxBounce2"|"triangle"|
|"arc"|"circle"|"squareCorners"|"circleQuarters"|"circleHalves"|"squish"|
|"toggle"|"toggle2"|"toggle3"|"toggle4"|"toggle5"|"toggle6"|
|"toggle7"|"toggle8"|"toggle9"|"toggle10"|"toggle11"|"toggle12"|
|"toggle13"|"arrow"|"arrow2"|"arrow3"|"bouncingBar"|"bouncingBall"|
|"smiley"|"monkey"|"hearts"|"clock"|"earth"|"moon"|
|"runner"|"pong"|"shark"|"dqpb"|"weather"|"christmas"|
|"grenade"|"point"|"layer"|

Example:
```js
const Spinner = require("@slimio/async-cli-spinner");

const spinner = new Spinner();
const dotsSpinner = new Spinner(spinner: "dots");
```
</details>


<details><summary>static startAll(functions: Spinner.Handler[], options?: Spinner.startOpt): Promise&ltany[]&gt</summary>
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

<details><summary>static create(fn: Spinner.Handler, args?: any): Function|[Function, ...any]</summary>
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

> Functions **start()**, **succeed()** and **failed()** are supposed to be executed in a function which return a promise and will be called by Spinner.startAll().

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
