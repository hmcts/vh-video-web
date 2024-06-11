import { Injectable } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class DeviceDetectionService {
    private loggerPrefix: string;

    constructor(protected logger: Logger) {}

    setLoggerPrefix(prefix: string): void {
        this.loggerPrefix = prefix;
    }

    isMobileIOSDevice(): boolean {
        const userAgent = navigator.userAgent || (window as any).opera;
        this.logger.info(`${this.loggerPrefix} Checking if user agent is mobile iOS device`, { userAgent: userAgent });

        if (/iPad|iPhone/.test(userAgent) && !(window as any).MSStream) {
            return true;
        }

        return false;
    }
}
