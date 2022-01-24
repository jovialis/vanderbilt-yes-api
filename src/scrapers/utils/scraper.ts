/**
 * Created by jovialis (Dylan Hanson) on 1/22/22.
 */

import {CookieJar} from "tough-cookie";

export type StreamedResponseHandler<T> =
    ((value: T, timestamp: number) => void)
    | ((value: T, timestamp: number) => Promise<void>);

export abstract class Scraper<T> {

    protected cookieJar: CookieJar;
    private _startTime: number;

    constructor(cookieJar?: CookieJar, startTime?: number) {
        this.cookieJar = cookieJar || new CookieJar();
        this._startTime = startTime;
    }

    abstract scrape(handler: StreamedResponseHandler<T>): Promise<T[]>;

    protected markStart(): number {
        this._startTime = Date.now();
        return this._startTime;
    }

    protected startTime(): number {
        return this._startTime;
    }

    protected timeSinceStart(): number {
        return Date.now() - this._startTime;
    }

    protected resetTime() {
        return this.markStart();
    }

    protected clearCookies() {
        this.cookieJar.removeAllCookiesSync();
    }

}