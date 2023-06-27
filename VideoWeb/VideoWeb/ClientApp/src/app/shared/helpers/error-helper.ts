import { browsers } from '../browser.constants';

export class ErrorHelper {
    static isPexRtcGetStatsError(err: Error) {
        // Detects a specific error thrown by PexRTC in Firefox which is not handled by the library
        return (
            err instanceof DOMException &&
            err.message === 'An attempt was made to use an object that is not, or is no longer, usable' &&
            err.stack.includes('PexRTC') &&
            err.stack.includes('getStats') &&
            navigator.userAgent.includes(browsers.Firefox)
        );
    }
}
