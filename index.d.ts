/// <reference types="@types/node" />
/// <reference types="@slimio/safe-emitter" />
import * as TTY from "tty";
import * as SafeEmitter from "@slimio/safe-emitter";


declare class Spinner{
    // Constructor
    constructor(options?: Spinner.options);

    // Properties
    private emitter: SafeEmitter;
    public spinner: Spinner.spinnerObj;
    public prefixText: string;
    public text: string;
    public color: string;
    public started: boolean;
    public stream: TTY.WriteStream;

    // static
    static count: number;
    static emitter: SafeEmitter;
    static startAll(functions: Function[], options?: Spinner.startOpt);
    static created(fn: Function, args?: any);

    // Function
    private lineToRender(symbol?: string);
    private renderLine(symbol?: string);
    private stop(text?: string);

    public start(text?: string);
    public succeed(text?: string);
    public failed(text?: string);
}


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

    interface startOpt {
        recap: true;
        rejects: true;
    }
}

export as namespace Spinner;
export = Spinner;