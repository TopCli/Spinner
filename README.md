# Spinner
![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/TopCli/Spinner/master/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/TopCli/Spinner/commit-activity)
[![mit](https://img.shields.io/github/license/Naereen/StrapDown.js.svg?style=for-the-badge)](https://github.com/TopCli/Spinner/blob/master/LICENSE)
![build](https://img.shields.io/github/actions/workflow/status/TopCli/Spinner/node.js.yml?style=for-the-badge)

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
import * as timers from "node:timers/promises";
import { Spinner } from "@topcli/spinner";

async function fnWithSpinner(withPrefix, succeed = true) {
    const spinner = new Spinner()
      .start("Start working!", { withPrefix });

    await timers.setTimeout(1000);
    spinner.text = "Work in progress...";
    await timers.setTimeout(1000);

    if (succeed) {
        spinner.succeed(`All done in ${spinner.elapsedTime.toFixed(2)}ms !`);
    }
    else {
        spinner.failed("Something wrong happened !");
    }
}

await Promise.allSettled([
    fnWithSpinner(),
    fnWithSpinner("Item 1"),
    fnWithSpinner("Item 2", false)
]);
Spinner.reset(); // reset internal count
console.log("All spinners finished!");
```

If you want to only achieve one Spinner by one Spinner, use it like Ora (it will work)
```js
const spinner = new Spinner().start("Start working!");

await timers.setTimeout(1_000);
spinner.text = "Work in progress...";

await timers.setTimeout(1_000);
spinner.succeed("All done !");
```

> 👀 When you are working on a CLI that can be used as an API too, the **verbose** option allow you to disable the Spinner.

## API

<details><summary>constructor(options?: ISpinnerOptions)</summary>
<br>

Create a new Spinner. The **options** payload is described by the following TypeScript interface:

```ts
export interface ISpinnerOptions {
  /**
   * Spinner name (from cli-spinners lib)
   *
   * @default "dots"
   */
  name?: cliSpinners.SpinnerName;
  /**
   * Spinner frame color
   *
   * @default "white"
   */
  color?: string;
  /**
   * Do not log anything when disabled
   *
   * @default true
   */
  verbose?: boolean;
}
```

> 👀 Check [cli-spinners](https://github.com/sindresorhus/cli-spinners#readme) for all the spinner name.

```js
new Spinner({ name: "dots2" });
```

</details>

<details><summary>start(text?: string, options?: IStartOptions): Spinner</summary>

Start the spinner and optionaly write the text passed as first parameter.

The **options** payload is described by the following TypeScript interface:

```ts
export interface IStartOptions {
  withPrefix?: string;
}
```

</details>

<details><summary>succeed(text?: string): void</summary>

Stop the spinner in the CLI, write the text passed in param and mark it as succeed with a symbol.

</details>

<details><summary>failed(text?: string): void</summary>

Stop the spinner in the CLI, write the text passed in param and mark it as failed with a symbol.

</details>
<br>

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/AlexandreMalaj"><img src="https://avatars.githubusercontent.com/u/32218832?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alexandre Malaj</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=AlexandreMalaj" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=AlexandreMalaj" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3AAlexandreMalaj" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
