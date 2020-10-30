/**
 * Application wide logger abstracting where logs end up.
 */
export abstract class Logger {
    abstract debug(message: string, properties?: any): void;
    abstract info(message: string, properties?: any): void;
    abstract warn(message: string, properties?: any): void;
    abstract event(event: string, properties?: any): void;
    abstract error(message: string, err: Error, properties?: any): void;
}
