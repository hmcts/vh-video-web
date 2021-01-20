import { Injectable } from '@angular/core';
import { Logger } from './logging/logger-base';
import { Observable, of, Subject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ConnectionStatusService {
    public readonly INTERVAL_IN_MS: number = 5000;
    public readonly NUMBER_OF_GOOD_PINGS_REQUIRED: number = 2;

    private readonly loggerPrefix = '[ConnectionStatusService] -';

    private connectionStatus = new Subject<boolean>();
    private timer: NodeJS.Timeout;
    private pings = new Array<boolean>(this.NUMBER_OF_GOOD_PINGS_REQUIRED);

    constructor(private logger: Logger, private http: HttpClient) {
        this.pings.every(x => (x = true));
    }

    get status() {
        return this.pings.every(x => x === true);
    }

    start() {
        if (this.timer) {
            this.logger.info(`${this.loggerPrefix} Timer already started`);
            return;
        }

        this.timer = setInterval(() => this.checkConnection(), this.INTERVAL_IN_MS);
        this.checkConnection();
    }

    checkNow() {
        this.checkConnection();
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    private checkConnection() {
        this.getFavicon().subscribe(result => {
            this.handleConnectionResult(result);
        });
    }

    private getFavicon(): Observable<boolean> {
        // NOTE: a status of "0" is received when app is offline
        return this.http.head('/assets/images/favicons/favicon.ico?_=' + new Date().getTime(), { observe: 'response' }).pipe(
            map(response => {
                return response.status > 0;
            }),
            catchError((err: HttpErrorResponse) => {
                return of(err.status !== 0);
            })
        );
    }

    private handleConnectionResult(connectionResult: boolean) {
        this.logger.info(`${this.loggerPrefix} ${connectionResult ? 'Good ping received' : 'Bad ping received'}`);
        if (this.status === connectionResult) {
            return;
        }

        this.pings.shift();
        this.pings.push(connectionResult);

        if (this.status === connectionResult) {
            this.logger.info(`${this.loggerPrefix} ${this.status ? 'Online' : 'Offline'}`);
            this.connectionStatus.next(this.status);
        }
    }

    onConnectionStatusChange(): Observable<boolean> {
        return this.connectionStatus.asObservable();
    }
}
