import { LogAdapter } from '../log-adapter';
import { Injectable } from '@angular/core';

@Injectable()
export class ConsoleLogger implements LogAdapter {
    debug(message: string, properties: any = null): void {
        const propertiesFormatted = properties ? JSON.stringify(properties) : '';
        console.debug(`${message} ${propertiesFormatted}`);
    }

    info(message: string, properties: any = null): void {
        const propertiesFormatted = properties ? JSON.stringify(properties) : '';
        console.info(`${message} ${propertiesFormatted}`);
    }

    warn(message: string, properties: any = null): void {
        const propertiesFormatted = properties ? JSON.stringify(properties) : '';
        console.warn(`${message} ${propertiesFormatted}`);
    }

    trackEvent(eventName: string, properties: any = null) {
        const propertiesFormatted = properties ? JSON.stringify(properties) : '';
        console.log(`[EVENT:${eventName}] ${propertiesFormatted}`.trim());
    }

    trackException(message: string, err: Error, properties: any = null) {
        console.error(`[ERROR] ${message}`, err);
        if (properties) {
            console.log(`Properties: ${JSON.stringify(properties)}`);
        }
    }
}
