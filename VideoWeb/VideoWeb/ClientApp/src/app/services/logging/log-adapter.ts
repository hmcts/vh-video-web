/**
 * Base class for loggers allowing us to easily change between console or app insights.
 */
export interface LogAdapter {
    debug(message: string): void;
    info(message: string): void;
    trackEvent(eventName: string, properties: any): void;
    trackException(message: string, err: Error, properties: any): void;
}
