/**
 * Application wide logger abstracting where logs end up.
 */
export abstract class Logger {
    abstract debug(message: string): void;
    abstract info(message: string): void;
    abstract event(event: string, properties?: any): void;
    abstract error(message: string, err: Error, properties?: any): void;
}
