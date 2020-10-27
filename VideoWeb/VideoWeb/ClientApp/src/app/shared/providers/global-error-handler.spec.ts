import { Injector, Type } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
import { GlobalErrorHandler } from './global-error-handler';

describe('GlobalErrorHandler', () => {
    let logger: jasmine.SpyObj<Logger>;
    let injector: jasmine.SpyObj<Injector>;
    let errorHandler: GlobalErrorHandler;

    beforeAll(() => {
        logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
        injector = jasmine.createSpyObj<Injector>('Injector', ['get']);
    });

    beforeEach(() => {
        injector.get.and.returnValue(logger);
        errorHandler = new GlobalErrorHandler(injector);
    });

    it('should init the logger from the injector and write error', () => {
        const error = new Error('failed to find data');
        errorHandler.handleError(error);
        expect(logger.error).toHaveBeenCalledWith('Unexpected error', error);
    });
});
