import { Injectable } from '@angular/core';
import { Logger } from './logging/logger-base';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConnectionStatusService {
    private readonly loggerPrefix = '[ConnectionStatusService] -';
    private readonly intervalMs = 5000;
    private connectionStatus = new Subject<boolean>();
    private timer: NodeJS.Timeout;
    status = true;

    constructor(private logger: Logger) {
    }

    start() {
        if (this.timer) {
            this.logger.info(`${this.loggerPrefix} Timer already started`);
            return;
        }

        this.timer = setInterval(() => this.checkConnection(), this.intervalMs);
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
        var self = this;
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', '/assets/images/favicons/favicon.ico?_=' + new Date().getTime());
        xhr.timeout = 5000;
        xhr.onload = () => {
            self.handleResult(true);
        };
        xhr.onerror = () => {
            self.handleResult(false);
        };
        xhr.ontimeout = () => {
            self.handleResult(false);
        };      

        try {
            xhr.send();
        } catch (_error) {
            self.handleResult(false);
        }
    }

    private handleResult(isSuccessful: boolean) {
        if (this.status === isSuccessful) {
            return;
        }

        this.logger.info(`${this.loggerPrefix} ${isSuccessful ? 'Online' : 'Offline'}`);
        this.status = isSuccessful;
        this.connectionStatus.next(isSuccessful);
    }

    onConnectionStatusChange(): Observable<boolean> {
        return this.connectionStatus.asObservable();
    }
}
