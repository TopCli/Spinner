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
    static DEFAULT_SPINNER: Spinner.spinners;
    static startAll(functions: Spinner.Handler[], options?: Spinner.startOpt): Promise<any[]>;
    static create(fn: Spinner.Handler, args?: any): Function|[Function, ...any];

    // Function
    private lineToRender(symbol?: string): string;
    private renderLine(symbol?: string): void;
    private stop(text?: string): void;

    public start(text?: string): Spinner;
    public succeed(text?: string): void;
    public failed(text?: string): void;
}


declare namespace Spinner {
    interface spinnerObj {
        frames: string[];
        interval: number;
    }

    interface options {
        spinner: spinnerObj|Spinner.spinners;
        text: string;
        prefixText: string;
        color: string;
        verbose: boolean;
    }

    interface startOpt {
        recap: true;
        rejects: true;
    }

    type Handler = () => Promise<any>

    enum spinners{
        "dots",
        "dots2",
        "dots3",
        "dots4",
        "dots5",
        "dots6",
        "dots7",
        "dots8",
        "dots9",
        "dots10",
        "dots11",
        "dots12",
        "dots11",
        "dots12",
        "line",
        "line2",
        "pipe",
        "simpleDots",
        "simpleDotsScrolling",
        "star",
        "star2",
        "flip",
        "hamburger",
        "growVertical",
        "growHorizontal",
        "balloon",
        "balloon2",
        "noise",
        "bounce",
        "boxBounce",
        "boxBounce2",
        "triangle",
        "arc",
        "circle",
        "squareCorners",
        "circleQuarters",
        "circleHalves",
        "squish",
        "toggle",
        "toggle2",
        "toggle3",
        "toggle4",
        "toggle5",
        "toggle6",
        "toggle7",
        "toggle8",
        "toggle9",
        "toggle10",
        "toggle11",
        "toggle12",
        "toggle13",
        "arrow",
        "arrow2",
        "arrow3",
        "bouncingBar",
        "bouncingBall",
        "smiley",
        "monkey",
        "hearts",
        "clock",
        "earth",
        "moon",
        "runner",
        "pong",
        "shark",
        "dqpb",
        "weather",
        "christmas",
        "grenade",
        "point",
        "layer"
    }
}

export as namespace Spinner;
export = Spinner;
