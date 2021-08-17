import { fakeAsync, flush } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, convertToParamMap, Event, NavigationEnd, ParamMap, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { Observable, Subject, Subscription } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import {
    ApiClient,
    ConferenceResponse,
    ConferenceStatus,
    EndpointStatus,
    LoggedParticipantResponse,
    ParticipantForUserResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from '../clients/api-client';
import { EventsService } from '../events.service';
import { LoggerService } from '../logging/logger.service';
import { ConferenceStatusMessage } from '../models/conference-status-message';

import { ConferenceService } from './conference.service';
import { ConferenceStatusChanged } from './models/conference-status-changed.model';

describe('ConferenceService', () => {
    const participantOneId = Guid.create().toString();
    const participantOne = new ParticipantForUserResponse({
        id: participantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpreter',
        role: Role.Individual,
        representee: null,
        case_type_group: 'applicant',
        tiled_display_name: `CIVILIAN;Interpreter;${participantOneId}`,
        hearing_role: HearingRole.INTERPRETER,
        first_name: 'Interpreter',
        last_name: 'Doe',
        interpreter_room: null,
        linked_participants: []
    });

    const participantTwoId = Guid.create().toString();
    const participantTwo = new ParticipantForUserResponse({
        id: participantTwoId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpretee',
        role: Role.Individual,
        representee: null,
        case_type_group: 'applicant',
        tiled_display_name: `CIVILIAN;Interpretee;${participantTwoId}`,
        hearing_role: HearingRole.LITIGANT_IN_PERSON,
        first_name: 'Interpretee',
        last_name: 'Doe',
        interpreter_room: null,
        linked_participants: []
    });

    const endpointOneId = Guid.create().toString();
    const endpointOne = new VideoEndpointResponse({
        id: endpointOneId,
        display_name: 'Endpoint 1',
        status: EndpointStatus.Disconnected,
        defence_advocate_username: 'username 1',
        pexip_display_name: `CIVILIAN;ENDPOINT;${endpointOneId}`
    });

    const endpointTwoId = Guid.create().toString();
    const endpointTwo = new VideoEndpointResponse({
        id: endpointTwoId,
        display_name: 'Endpoint 2',
        status: EndpointStatus.Connected,
        defence_advocate_username: 'username 2',
        pexip_display_name: `CIVILIAN;ENDPOINT;${endpointTwoId}`
    });

    let sut: ConferenceService;

    let routerSpy: jasmine.SpyObj<Router>;
    let eventsSubject: Subject<Event>;
    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let getHearingStatusMessageSubject: Subject<ConferenceStatusMessage>;
    let getHearingStatusMessage$: Observable<ConferenceStatusMessage>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let activatedRouteFirstChildSpy: jasmine.SpyObj<ActivatedRoute>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let getParticipantsByConferenceIdSubject: Subject<ParticipantForUserResponse[]>;
    let getEndpointsByConferenceIdSubject: Subject<VideoEndpointResponse[]>;
    let getLoggedParticipantForConferenceSubject: Subject<LoggedParticipantResponse>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate'], ['events']);

        eventsSubject = new Subject<Event>();
        getSpiedPropertyGetter(routerSpy, 'events').and.returnValue(eventsSubject.asObservable());

        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['getServiceReconnected', 'getHearingStatusMessage']);
        getHearingStatusMessageSubject = new Subject<ConferenceStatusMessage>();
        getHearingStatusMessage$ = getHearingStatusMessageSubject.asObservable();
        eventsServiceSpy.getHearingStatusMessage.and.returnValue(getHearingStatusMessage$);

        activatedRouteSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['firstChild', 'snapshot', 'paramsMap']);
        activatedRouteFirstChildSpy = jasmine.createSpyObj<ActivatedRoute>('ActivatedRoute', ['toString'], ['paramMap']);

        getSpiedPropertyGetter(activatedRouteSpy, 'firstChild').and.returnValue(activatedRouteFirstChildSpy);

        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'getConferenceById',
            'getCurrentParticipant',
            'getParticipantsByConferenceId',
            'getVideoEndpointsForConference'
        ]);

        getParticipantsByConferenceIdSubject = new Subject<ParticipantForUserResponse[]>();
        getEndpointsByConferenceIdSubject = new Subject<VideoEndpointResponse[]>();
        getLoggedParticipantForConferenceSubject = new Subject<LoggedParticipantResponse>();
        apiClientSpy.getParticipantsByConferenceId.and.returnValue(getParticipantsByConferenceIdSubject.asObservable());
        apiClientSpy.getVideoEndpointsForConference.and.returnValue(getEndpointsByConferenceIdSubject.asObservable());
        apiClientSpy.getCurrentParticipant.and.returnValue(getLoggedParticipantForConferenceSubject.asObservable());

        loggerSpy = jasmine.createSpyObj<LoggerService>('Logger', ['error', 'warn', 'info']);

        sut = new ConferenceService(routerSpy, activatedRouteSpy, eventsServiceSpy, apiClientSpy, loggerSpy);
    });

    describe('handle navigation end', () => {
        it('should call getConferenceById when the router navigation ends and conference id is in the param map', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const routeSnapshot = new ActivatedRouteSnapshot();
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshot);
            spyOnProperty(routeSnapshot, 'paramMap', 'get').and.returnValue(
                convertToParamMap({
                    conferenceId: conferenceId
                })
            );

            const getConferenceSubject = new Subject<ConferenceResponse>();
            const getConference$ = getConferenceSubject.asObservable();

            spyOn(getConference$, 'subscribe').and.callThrough();
            apiClientSpy.getConferenceById.and.returnValue(getConference$);

            const expectedConferenceResult = new ConferenceResponse({
                id: conferenceId,
                status: ConferenceStatus.NotStarted
            });

            const expectedConferenceStatusResult = { newStatus: expectedConferenceResult.status, oldStatus: null };

            let currentConferenceResult = null;
            sut.currentConference$.subscribe(conference => (currentConferenceResult = conference));
            let conferenceStatusResult = null;
            sut.onCurrentConferenceStatusChanged$.subscribe(update => (conferenceStatusResult = update));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            getConferenceSubject.next(expectedConferenceResult);
            flush();

            // Assert
            expect(apiClientSpy.getConferenceById).toHaveBeenCalledOnceWith(conferenceId);
            expect(getConference$.subscribe).toHaveBeenCalledTimes(1);
            expect(currentConferenceResult).toBeTruthy();
            expect(sut.currentConference).toEqual(expectedConferenceResult);
            expect(sut.currentConferenceId).toEqual(expectedConferenceResult.id);
            expect(currentConferenceResult).toEqual(expectedConferenceResult);
            expect(conferenceStatusResult).toEqual(expectedConferenceStatusResult);
        }));

        it('should NOT call getConferenceId when the router navigation ends and conference id is NOT in the param map', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const routeSnapshotSpy = jasmine.createSpyObj<ActivatedRouteSnapshot>(
                'ActivatedRouteSnapshot',
                ['toString'],
                ['firstChild', 'paramMap']
            );
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshotSpy);
            getSpiedPropertyGetter(routeSnapshotSpy, 'paramMap').and.returnValue(
                convertToParamMap({
                    notConferenceId: conferenceId
                })
            );

            const getConferenceSubject = new Subject<ConferenceResponse>();
            const getConference$ = getConferenceSubject.asObservable();

            spyOn(getConference$, 'subscribe').and.callThrough();
            apiClientSpy.getConferenceById.and.returnValue(getConference$);

            const expectedConference = new ConferenceResponse({
                id: conferenceId
            });

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            getConferenceSubject.next(expectedConference);
            flush();

            // Assert
            expect(apiClientSpy.getConferenceById).not.toHaveBeenCalled();
            expect(getConference$.subscribe).not.toHaveBeenCalled();
        }));

        it('should emit null for the conference if the conference id is NOT in the url', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const routeSnapshotSpy = jasmine.createSpyObj<ActivatedRouteSnapshot>(
                'ActivatedRouteSnapshot',
                ['toString'],
                ['firstChild', 'paramMap']
            );
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshotSpy);
            getSpiedPropertyGetter(routeSnapshotSpy, 'paramMap').and.returnValue(
                convertToParamMap({
                    notConferenceId: conferenceId
                })
            );
            let result = null;
            sut.currentConference$.subscribe(conference => (result = conference));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            // Assert
            expect(result).toBeNull();
        }));

        it('should emit null for the old status and new if the conference id is NOT in the url', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const routeSnapshotSpy = jasmine.createSpyObj<ActivatedRouteSnapshot>(
                'ActivatedRouteSnapshot',
                ['toString'],
                ['firstChild', 'paramMap']
            );
            getSpiedPropertyGetter(activatedRouteSpy, 'snapshot').and.returnValue(routeSnapshotSpy);
            getSpiedPropertyGetter(routeSnapshotSpy, 'paramMap').and.returnValue(
                convertToParamMap({
                    notConferenceId: conferenceId
                })
            );

            const expectedResult: ConferenceStatusChanged = { oldStatus: null, newStatus: null };
            let result: ConferenceStatusChanged = null;
            sut.onCurrentConferenceStatusChanged$.subscribe(status => (result = status));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            // Assert
            expect(result).toEqual(expectedResult);
        }));
    });

    describe('setupConferenceSubscriptions', () => {
        it('should unsubscribe from existing subscribers', () => {
            // Arrange
            const sub = jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']);
            sut['subscriptions'] = [sub];

            // Act
            sut.setupConferenceSubscriptions();

            // Arrange
            expect(sub.unsubscribe).toHaveBeenCalled();
            expect(sut['subscriptions']).not.toContain(sub);
        });
    });

    describe('handle conference status updates', () => {
        it('should NOT handle the update if the update is NOT for this current conference', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';

            const existingStatus = ConferenceStatus.InSession;
            const statusUpdate = new ConferenceStatusMessage(conferenceId, ConferenceStatus.Closed);

            const expectedConference = new ConferenceResponse({
                id: 'not-conference-id',
                status: existingStatus
            });

            spyOnProperty(sut, 'currentConference', 'get').and.returnValue(expectedConference);
            spyOnProperty(sut, 'currentConferenceId', 'get').and.returnValue(expectedConference.id);

            const expectedResult = null;
            let result = null;

            sut.onCurrentConferenceStatusChanged$.subscribe(update => (result = update));

            sut.setupConferenceSubscriptions();

            // Act
            getHearingStatusMessageSubject.next(statusUpdate);
            flush();
            flush();

            // Assert
            expect(sut.currentConference.status).toEqual(existingStatus);
            expect(result).toEqual(expectedResult);
        }));

        it('should update the current conference status and emit a message if the status is different', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const existingStatus = ConferenceStatus.InSession;
            const statusUpdate = new ConferenceStatusMessage(conferenceId, ConferenceStatus.Closed);

            const expectedConference = new ConferenceResponse({
                id: conferenceId,
                status: existingStatus
            });

            spyOnProperty(sut, 'currentConference', 'get').and.returnValue(expectedConference);
            spyOnProperty(sut, 'currentConferenceId', 'get').and.returnValue(expectedConference.id);

            const expectedResult = {
                oldStatus: existingStatus,
                newStatus: statusUpdate.status
            };
            let result = null;

            sut.onCurrentConferenceStatusChanged$.subscribe(update => (result = update));

            sut.setupConferenceSubscriptions();

            // Act
            getHearingStatusMessageSubject.next(statusUpdate);
            flush();
            flush();

            // Assert
            expect(sut.currentConference.status).toEqual(statusUpdate.status);
            expect(result).toEqual(expectedResult);
        }));

        it('should NOT update the current conference status and NOT emit a message if the status is NOT different', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const existingStatus = ConferenceStatus.Closed;
            const statusUpdate = new ConferenceStatusMessage(conferenceId, existingStatus);

            const expectedConference = new ConferenceResponse({
                id: conferenceId,
                status: existingStatus
            });

            spyOnProperty(sut, 'currentConference', 'get').and.returnValue(expectedConference);
            spyOnProperty(sut, 'currentConferenceId', 'get').and.returnValue(expectedConference.id);

            const expectedResult = null;
            let result = null;

            sut.onCurrentConferenceStatusChanged$.subscribe(update => (result = update));

            sut.setupConferenceSubscriptions();

            // Act
            getHearingStatusMessageSubject.next(statusUpdate);
            flush();
            flush();

            // Assert
            expect(sut.currentConference.status).toEqual(existingStatus);
            expect(result).toEqual(expectedResult);
        }));
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

    describe('getParticipantsForConference', () => {
        it('should return the participants from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses = [participantOne, participantTwo];

            let result: ParticipantModel[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceIdSubject.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(
                participantResponses.map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
            );
        }));

        it('should return the participants from VideoWebService when called with a GUID', fakeAsync(() => {
            // Arrange
            const participantResponses = [participantOne, participantTwo];
            const conferenceId = Guid.create();

            let result: ParticipantModel[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceIdSubject.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId.toString());
            expect(result).toEqual(
                participantResponses.map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
            );
        }));

        it('should return an empty array if no particiapnts are returned from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses: ParticipantForUserResponse[] = [];

            let result: ParticipantModel[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceIdSubject.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual([]);
        }));
    });

    describe('getEndpointsForConference', () => {
        it('should return the endpoints from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const endpointResponses = [endpointOne, endpointTwo];

            let result: ParticipantModel[];

            // Act
            sut.getEndpointsForConference(conferenceId).subscribe(participants => (result = participants));
            getEndpointsByConferenceIdSubject.next(endpointResponses);
            flush();

            // Assert
            expect(apiClientSpy.getVideoEndpointsForConference).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(
                endpointResponses.map(participantResponse => ParticipantModel.fromVideoEndpointResponse(participantResponse))
            );
        }));

        it('should return the endpoints from VideoWebService when called with a GUID', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const endpointResponses = [endpointOne, endpointTwo];

            let result: ParticipantModel[];

            // Act
            sut.getEndpointsForConference(conferenceId).subscribe(participants => (result = participants));
            getEndpointsByConferenceIdSubject.next(endpointResponses);
            flush();

            // Assert
            expect(apiClientSpy.getVideoEndpointsForConference).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(
                endpointResponses.map(participantResponse => ParticipantModel.fromVideoEndpointResponse(participantResponse))
            );
        }));

        it('should return an empty array if no endpoints are returned from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const endpointResponses = [];

            let result: ParticipantModel[];

            // Act
            sut.getEndpointsForConference(conferenceId).subscribe(participants => (result = participants));
            getEndpointsByConferenceIdSubject.next(endpointResponses);
            flush();

            // Assert
            expect(apiClientSpy.getVideoEndpointsForConference).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual([]);
        }));
    });

    describe('getLoggedInParticipantForConference', () => {
        it('should return the logged in participant', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            let result = null;

            // Act
            sut.getLoggedInParticipantForConference(conferenceId).subscribe(participant => (result = participant));
            getParticipantsByConferenceIdSubject.next([participantOne, participantTwo]);
            flush();
            getLoggedParticipantForConferenceSubject.next(
                new LoggedParticipantResponse({
                    participant_id: participantOneId
                })
            );
            flush();

            // Assert
            expect(result).toEqual(ParticipantModel.fromParticipantForUserResponse(participantOne));
        }));
    });
});
