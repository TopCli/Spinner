/// <reference types="@types/node" />
/// <reference types="cli-spinners" />

import * as TTY from "tty";
import * as events from "events";
import * as cliSpinners from "cli-spinners";

declare class Spinner {
  static count: number;
  static emitter: events.EventEmitter;
  static DEFAULT_SPINNER: Spinner.spinners;

  static startAll(functions: Spinner.Handler[], options?: Spinner.startOpt): Promise<any[]>;
  static create(fn: Spinner.Handler, args?: any): Spinner.Handler | [Spinner.Handler, ...any];

  constructor(options?: Spinner.Configuration);

  // Properties
  private emitter: events.EventEmitter;
  public spinner: cliSpinners.Spinner;
  public prefixText: string;
  public text: string;
  public color: string;
  public started: boolean;
  public startTime: number;
  public stream: TTY.WriteStream;
  public readonly elapsedTime: number;

  // Methods
  private lineToRender(symbol?: string): string;
  private renderLine(symbol?: string): void;
  private stop(text?: string): void;

  public start(text?: string): Spinner;
  public succeed(text?: string): void;
  public failed(text?: string): void;
}

declare namespace Spinner {
  type RecapSet = "none" | "error" | "always";

  interface Configuration {
    spinner?: cliSpinners.Spinner | cliSpinners.SpinnerName;
    text?: string;
    prefixText?: string;
    color?: string;
    verbose?: boolean;
  }

  interface startOpt {
    recap?: RecapSet;
    rejects?: boolean;
  }

  type Handler = () => Promise<any>
}

export as namespace Spinner;
export = Spinner;
