/// <reference types="@types/node" />
/// <reference types="cli-spinners" />

import * as TTY from "tty";
import * as events from "events";
import * as cliSpinners from "cli-spinners";

export {
  Spinner,
  ISpinnerOptions,
  IStartAllOptions,
  SpinnerHandler
};

interface ISpinnerOptions {
  spinner?: cliSpinners.Spinner | cliSpinners.SpinnerName;
  text?: string;
  prefixText?: string;
  color?: string;
  verbose?: boolean;
}

interface IStartAllOptions {
  recap?: "none" | "error" | "always";
  rejects?: boolean;
}

type SpinnerHandler = () => Promise<any>

declare class Spinner {
  static count: number;
  static emitter: events.EventEmitter;
  static DEFAULT_SPINNER: Spinner.spinners;

  static startAll(functions: SpinnerHandler[], options?: IStartAllOptions): Promise<any[]>;
  static create(fn: SpinnerHandler, args?: any): SpinnerHandler | [SpinnerHandler, ...any];

  constructor(options?: ISpinnerOptions);

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
