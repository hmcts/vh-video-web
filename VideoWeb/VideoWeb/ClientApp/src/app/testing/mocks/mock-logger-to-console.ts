import { Logger } from 'src/app/services/logging/logger-base';

export class MockLoggerToConsole implements Logger {
    warn(message: string): void {
        console.warn(message);
    }
    debug(message: string): void {
        console.debug(message);
    }
    info(message: string): void {
        console.info(message);
    }
    event(event: string, properties?: any): void {}
    error(message: string, err: Error, properties?: any): void {
        console.error(message);
    }
}
