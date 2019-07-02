import { LogAdapter } from './log-adapter';

export class ConsoleLogger implements LogAdapter {
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
