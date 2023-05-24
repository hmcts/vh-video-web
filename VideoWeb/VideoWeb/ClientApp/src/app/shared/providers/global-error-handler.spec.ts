import { Injector, NgZone } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
import { Router } from '@angular/router';
import { LoggerService } from 'src/app/services/logging/logger.service';
import { pageUrls } from '../page-url.constants';

describe('GlobalErrorHandler', () => {
    let ngZoneSpy: jasmine.SpyObj<NgZone>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;
    let injector: Injector;
    let redirectToSpy: jasmine.Spy;
    let errorHandler: GlobalErrorHandler;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        ngZoneSpy = jasmine.createSpyObj<NgZone>('NgZone', ['run']);
        loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);
        ngZoneSpy.run.and.callThrough();

        injector = Injector.create({ providers: [] });
        spyOn(injector, 'get').and.callFake(token => {
            if (token === Router) {
                return routerSpy;
            } else {
                return loggerSpy;
            }
        });

        errorHandler = new GlobalErrorHandler(injector, ngZoneSpy);
        redirectToSpy = spyOn(errorHandler, 'redirectTo');
    });

    it('navigates to unauthorised page when 401 status code is returned', () => {
        errorHandler.handleError({ status: 401 });
        expect(redirectToSpy).toHaveBeenCalledWith(routerSpy, pageUrls.Unauthorised);
    });

    it('navigates to error page when status code is not 401 or 403', () => {
        errorHandler.handleError({ status: 500 });
        expect(redirectToSpy).toHaveBeenCalledWith(routerSpy, pageUrls.ServiceError);
    });

    it('navigates to unauthorised page when 403 status code is returned', () => {
        errorHandler.handleError({ status: 403 });
        expect(redirectToSpy).toHaveBeenCalledWith(routerSpy, pageUrls.Unauthorised);
    });
});
