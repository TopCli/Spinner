# Spinner

![version](https://img.shields.io/badge/dynamic/json.svg?style=for-the-badge&url=https://raw.githubusercontent.com/TopCli/Spinner/main/package.json&query=$.version&label=Version)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://github.com/TopCli/Spinner/commit-activity)
[![mit](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://github.com/TopCli/Spinner/blob/main/LICENSE)
[![scorecard](https://api.securityscorecards.dev/projects/github.com/TopCli/Spinner/badge?style=for-the-badge)](https://ossf.github.io/scorecard-visualizer/#/projects/github.com/TopCli/Spinner)
![build](https://img.shields.io/github/actions/workflow/status/TopCli/Spinner/node.js.yml?style=for-the-badge)

Run multiple CLI spinners at the same time. Each `Spinner` has its own text and
state, while a shared renderer keeps active spinners aligned in the terminal.

Spinner animations come from [`cli-spinners`](https://github.com/sindresorhus/cli-spinners#readme). The API is
inspired by [Ora](https://github.com/sindresorhus/ora), with support for concurrent asynchronous work.

## 🚧 Requirements

- [Node.js](https://nodejs.org/en/) v22 or higher

## 💃 Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @topcli/spinner
# or
$ yarn add @topcli/spinner
```

## 👀 Usage example

Start each spinner independently, then wait for the work to settle:

```js
import * as timers from "node:timers/promises";
import { Spinner } from "@topcli/spinner";

async function runTask(label, shouldFail = false) {
  const spinner = new Spinner().start(label);

  await timers.setTimeout(1_000);
  spinner.text = `${label}: still working`;
  await timers.setTimeout(1_000);

  if (shouldFail) {
    spinner.failed(`${label}: failed`);
  }
  else {
    spinner.succeed(`${label}: done in ${spinner.elapsedTime.toFixed(0)}ms`);
  }
}

await Promise.allSettled([
  runTask("Build"),
  runTask("Test"),
  runTask("Deploy", true)
]);
```

> [!TIP]
> Set `verbose: false` to suppress spinner output when your CLI is used as an
> API.

## 📚 API

- [`Spinner`](./docs/Spinner.md): create, update and settle one spinner.
- [`computeWithSpinner`](./docs/computeWithSpinner.md): run an asynchronous
  operation with spinner lifecycle handling.

## ✨ Contributors

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/thomas-gentilhomme/"><img src="https://avatars.githubusercontent.com/u/4438263?v=4?s=100" width="100px;" alt="Gentilhomme"/><br /><sub><b>Gentilhomme</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=fraxken" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/pulls?q=is%3Apr+reviewed-by%3Afraxken" title="Reviewed Pull Requests">👀</a> <a href="#security-fraxken" title="Security">🛡️</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3Afraxken" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AlexandreMalaj"><img src="https://avatars.githubusercontent.com/u/32218832?v=4?s=100" width="100px;" alt="Alexandre Malaj"/><br /><sub><b>Alexandre Malaj</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=AlexandreMalaj" title="Code">💻</a> <a href="https://github.com/TopCli/Spinner/commits?author=AlexandreMalaj" title="Documentation">📖</a> <a href="https://github.com/TopCli/Spinner/issues?q=author%3AAlexandreMalaj" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/PierreDemailly"><img src="https://avatars.githubusercontent.com/u/39910767?v=4?s=100" width="100px;" alt="PierreDemailly"/><br /><sub><b>PierreDemailly</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/commits?author=PierreDemailly" title="Code">💻</a> <a href="#maintenance-PierreDemailly" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://justie.dev"><img src="https://avatars.githubusercontent.com/u/7118300?v=4?s=100" width="100px;" alt="Ben"/><br /><sub><b>Ben</b></sub></a><br /><a href="https://github.com/TopCli/Spinner/issues?q=author%3AJUSTIVE" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License
MIT
