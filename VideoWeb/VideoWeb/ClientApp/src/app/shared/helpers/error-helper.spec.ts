import { ErrorHelper } from './error-helper';

describe('ErrorHelper', () => {
    let errorHelper: ErrorHelper;
    const pexRtcGetStatsErrorMessage = 'An attempt was made to use an object that is not, or is no longer, usable';
    const pexRtcGetStatsErrorStack = 'PexRTC.getStats';
    const firefoxUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/114.0';

    beforeEach(() => {
        errorHelper = new ErrorHelper();
    });

    it('should identify PexRTC getStats error in Firefox', () => {
        const error = new DOMException(pexRtcGetStatsErrorMessage);
        error.stack = pexRtcGetStatsErrorStack;
        spyOnProperty(navigator, 'userAgent').and.returnValue(firefoxUserAgent);

        const result = errorHelper.isPexRtcGetStatsError(error);

        expect(result).toBeTrue();
    });

    it('should not identify non-PexRTC getStats error', () => {
        const error = new DOMException('Some other error');
        error.stack = pexRtcGetStatsErrorStack;
        spyOnProperty(navigator, 'userAgent').and.returnValue(firefoxUserAgent);

        const result = errorHelper.isPexRtcGetStatsError(error);

        expect(result).toBeFalse();
    });

    it('should not identify PexRTC getStats error in other browsers', () => {
        const error = new DOMException(pexRtcGetStatsErrorMessage);
        error.stack = pexRtcGetStatsErrorStack;
        spyOnProperty(navigator, 'userAgent').and.returnValue('Some other browser user agent');

        const result = errorHelper.isPexRtcGetStatsError(error);

        expect(result).toBeFalse();
    });

    it('should not identify PexRTC getStats error when stack is null', () => {
        const error = new DOMException(pexRtcGetStatsErrorMessage);
        spyOnProperty(navigator, 'userAgent').and.returnValue(firefoxUserAgent);

        const result = errorHelper.isPexRtcGetStatsError(error);

        expect(result).toBeFalse();
    });
});
