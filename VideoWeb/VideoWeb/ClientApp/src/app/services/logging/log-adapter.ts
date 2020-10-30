/**
 * Base class for loggers allowing us to easily change between console or app insights.
 */
export interface LogAdapter {
    debug(message: string, properties: any): void;
    info(message: string, properties: any): void;
    warn(message: string, properties: any): void;
    trackEvent(eventName: string, properties: any): void;
    trackException(message: string, err: Error, properties: any): void;
}
