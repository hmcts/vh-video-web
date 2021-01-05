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
        window.addEventListener('online', this.checkConnection);
        window.addEventListener('offline', this.checkConnection);
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
        clearInterval(this.timer);
    }

    private checkConnection() {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', '/assets/images/favicons/favicon.ico?_=' + new Date().getTime());
        xhr.timeout = 5000;
        xhr.onload = () => {
            this.handleResult(true);
        };
        xhr.onerror = e => {
            this.handleResult(false);
        };
        xhr.ontimeout = () => {
            this.handleResult(false);
        };
        try {
            xhr.send();
        } catch (_error) {
            this.handleResult(false);
        }
    }

    private handleResult(online: boolean) {
        if (this.status === online) {
            return;
        }

        this.logger.info(`${this.loggerPrefix} ${online ? 'Online' : 'Offline'}`);
        this.status = online;
        this.connectionStatus.next(online);
    }

    onConnectionStatusChange(): Observable<boolean> {
        return this.connectionStatus.asObservable();
    }
}
