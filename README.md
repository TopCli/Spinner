# Spinner
![version](https://img.shields.io/badge/dynamic/json.svg?url=https://raw.githubusercontent.com/TopCli/Spinner/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/TopCli/Spinner/commit-activity)
[![Security Responsible Disclosure](https://img.shields.io/badge/Security-Responsible%20Disclosure-yellow.svg)](https://github.com/nodejs/security-wg/blob/master/processes/responsible_disclosure_template.md
)
[![mit](https://img.shields.io/github/license/Naereen/StrapDown.js.svg)](https://github.com/TopCli/Spinner/blob/master/LICENSE)
![build](https://img.shields.io/github/workflow/status/TopCli/Spinner/Node.js%20CI)

Asynchronous CLI Spinner. This package has been created to handle simultaneous/multiple spinner at a time. The package has been inspired by [Ora](https://github.com/sindresorhus/ora) but in Asynchronous.

All available spinners are part of [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) package.

<p align="center">
<img src="https://github.com/SlimIO/Governance/blob/master/docs/images/cli_init.gif">
</p>

## Requirements
- [Node.js](https://nodejs.org/en/) v16 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @topcli/spinner
# or
$ yarn add @topcli/spinner
```

## Usage example
Create and wait multiple spinner at a time.
```js
import { setTimeout: sleep } from "timers/promises";
import Spinner from "@topcli/spinner";

async function fnWithSpinner(prefixText, succeed = true) {
    const spinner = new Spinner({ prefixText }).start("Start working!");

    await sleep(1000);
    spinner.text = "Work in progress...";
    await sleep(1000);

    if (succeed) {
        spinner.succeed(`All done in ${spinner.elapsedTime.toFixed(2)}ms !`);
    }
    else {
        spinner.failed("Something wrong happened !");
    }
}

await Spinner.startAll([
    fnWithSpinner,
    Spinner.create(fnWithSpinner),
    Spinner.create(fnWithSpinner, "Item 1"),
    Spinner.create(fnWithSpinner, "Item 2", false)
]);
console.log("All spinners finished!");
```

If you want to only achieve one Spinner by one Spinner, use it like Ora (it will work)
```js
const spinner = new Spinner().start("Start working!");

await sleep(1000);
spinner.text = "Work in progress...";

await sleep(1000);
spinner.succeed("All done !");
```

> 👀 When you are working on a CLI that can be used as an API too, the **verbose** option allow you to disable the Spinner.

## API

Spinner line structure : `${spinner} ${prefixText} - ${text}`

Properties :
```ts
declare namespace Spinner {
  public spinner: cliSpinners.Spinner;
  public prefixText: string;
  public text: string;
  public color: string;
  public started: boolean;
  public startTime: number;
  public stream: TTY.WriteStream;
  public readonly elapsedTime: number;
}
```

- `spinner`: spinner type (default: `"dots"`)
- `prefixText`: mostly used to differentiate each spinner
- `text`: you can change text at any moment.
- `color`: spinner color
- `elapsedTime`: time elapsed since start() call


<details><summary>constructor(options?: Spinner.options)</summary>
<br>

Create a new Spinner object. **options** is described by the following TypeScript interface:

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
import Spinner from "@topcli/spinner";

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
  type RecapSet = "none" | "error" | "always";

  interface startOpt {
    recap: RecapSet;
    rejects: boolean;
  }
}
```
> Default recap : `always`
</details>

<details><summary>static create(fn: Spinner.Handler, args?: any): Function|[Function, ...any]</summary>
<br>
This method allow to pass arguments to our spinner function. This method prevent execute function to earlier.

```js
async function fnWithSpinner(prefixText) {
  const spinner = new Spinner({ prefixText }).start("Start working!");

  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.text = "Work in progress...";

  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.succeed("All done !");
}

Spinner.startAll([
  fnWithSpinner("Item 1"), // <-- Wrong, it's executed directly, not in startAll
  Spinner.create(fnWithSpinner, "Item 2") // <-- What you should do
])
.then(() => console.log("All spinners finished!"))
.catch(console.error);
```
</details>

-------------------------------------------------

<details><summary>start(text?: string): Spinner</summary>

Start the spinner in the CLI and write the text passed in param.
```js
import Spinner from "@topcli/spinner";

async function fnWithSpinner() {
  const spinner = new Spinner().start("Start working!");
}

Spinner.startAll([
  fnWithSpinner
])
.then(() => console.log("All spinners finished!"))
.catch(console.error);
```
</details>

<details><summary>succeed(text?: string): void</summary>

Stop the spinner in the CLI, write the text passed in param and mark it as succeed with a symbol.
```js
import Spinner from "@topcli/spinner";

async function fnWithSpinner() {
  const spinner = new Spinner().start("Start working!");

  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.succeed("All done !");
}

Spinner.startAll([
  fnWithSpinner
])
.then(() => console.log("All spinners finished!"))
.catch(console.error);
```
</details>

<details><summary>failed(text?: string): void</summary>

Stop the spinner in the CLI, write the text passed in param and mark it as failed with a symbol.

```js
import Spinner from "@topcli/spinner";

async function fnWithSpinner() {
  const spinner = new Spinner().start("Start working!");

  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.failed("Something wrong happened !");
}

Spinner.startAll([
  fnWithSpinner
])
.then(() => console.log("All spinners finished!"))
.catch(console.error);
```
</details>
<br>

> ⚠️ Functions **start()**, **succeed()** and **failed()** are supposed to be executed in a function which return a promise and will be called by Spinner.startAll().

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
