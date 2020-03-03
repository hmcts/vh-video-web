import { Logger } from 'src/app/services/logging/logger-base';

export class MockLogger implements Logger {
    warn(message: string): void {
        console.warn(message);
    }
    debug(message: string): void {
        console.debug(message);
    }
    info(message: string): void {
        console.info(message);
    }
    event(event: string, properties?: any): void {
        const propertiesFormatted = properties ? JSON.stringify(properties) : '';
        console.log(`[EVENT:${event}] ${propertiesFormatted}`.trim());
    }
    error(message: string, err: Error, properties?: any): void {
        console.error(`[ERROR] ${message}`, err);
        if (properties) {
            console.log(`Properties: ${JSON.stringify(properties)}`);
        }
    }
}
