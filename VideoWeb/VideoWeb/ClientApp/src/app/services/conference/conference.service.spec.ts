import { flush } from '@angular/core/testing';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ApiClient, ConferenceResponse } from '../clients/api-client';
import { Logger } from '../logging/logger-base';

import { ConferenceService } from './conference.service';

describe('ConferenceService', () => {
    let sut: ConferenceService;

    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let activatedRouteFirstChildSpy: jasmine.SpyObj<ActivatedRoute>;
    let paramMapSubject: Subject<ParamMap>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        activatedRouteSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['firstChild', 'paramsMap']);
        activatedRouteFirstChildSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['paramMap']);

        getSpiedPropertyGetter(activatedRouteSpy, 'firstChild').and.returnValue(activatedRouteFirstChildSpy);

        paramMapSubject = new Subject<ParamMap>();
        getSpiedPropertyGetter(activatedRouteFirstChildSpy, 'paramMap').and.returnValue(paramMapSubject.asObservable());

        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getConferenceById']);

        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['warn']);

        sut = new ConferenceService(activatedRouteSpy, apiClientSpy, loggerSpy);
    });

    it('should be created', () => {
        expect(sut).toBeTruthy();
    });

    it('should subscribe to the first child param map on construction', () => {
        // Arrange
        const paramMap$ = new Observable<ParamMap>();
        spyOn(paramMapSubject, 'asObservable').and.returnValue(paramMap$);
        spyOn(paramMap$, 'subscribe').and.callThrough();

        // Act
        new ConferenceService(activatedRouteSpy, apiClientSpy, loggerSpy);

        // Assert
        expect(paramMap$.subscribe).toHaveBeenCalledTimes(1);
    });

    describe('getConferenceById', () => {
        it('should return the observable returned by apiClient.getConferenceById', () => {
            // Arrange
            const conferenceId = 'conference-id';

            const expectedResult = new Observable<ConferenceResponse>();
            apiClientSpy.getConferenceById.and.returnValue(expectedResult);

            // Act
            const result = sut.getConferenceById(conferenceId);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(apiClientSpy.getConferenceById).toHaveBeenCalledOnceWith(conferenceId);
        });
    });
});
