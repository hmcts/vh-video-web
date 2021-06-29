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

    describe('construction', () => {
        it('should be created', () => {
            expect(sut).toBeTruthy();
        });

        it('should subscribe to the first child param map on construction', () => {
            // Arrange
            const events$ = new Observable<Event>();
            spyOn(events$, 'pipe').and.returnValue(events$);
            spyOn(events$, 'subscribe').and.callThrough();

            getSpiedPropertyGetter(routerSpy, 'events').and.returnValue(events$);

            // Act
            new ConferenceService(routerSpy, activatedRouteSpy, eventsServiceSpy, apiClientSpy, loggerSpy);

            // Assert
            expect(events$.subscribe).toHaveBeenCalledTimes(1);
        });
    });

    describe('handle navigation end', () => {
        it('should call getConferenceId when the router navigation ends and conference id is in the param map', fakeAsync(() => {
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

            const expectedConference = new ConferenceResponse({
                id: conferenceId
            });

            let result = null;
            sut.currentConference$.subscribe(conference => (result = conference));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            getConferenceSubject.next(expectedConference);
            flush();

            // Assert
            expect(apiClientSpy.getConferenceById).toHaveBeenCalledOnceWith(conferenceId);
            expect(getConference$.subscribe).toHaveBeenCalledTimes(1);
            expect(result).toBeTruthy();
            expect(result).toBe(expectedConference);
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

            let result = null;
            sut.currentConference$.subscribe(conference => (result = conference));

            // Act
            eventsSubject.next(new NavigationEnd(0, 'url', 'url-redirects'));
            flush();

            getConferenceSubject.next(expectedConference);
            flush();

            // Assert
            expect(apiClientSpy.getConferenceById).not.toHaveBeenCalled();
            expect(getConference$.subscribe).not.toHaveBeenCalled();
            expect(result).toBeFalsy();
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
        it('should not handle the update if the update is not for this current conference', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';

            const existingStatus = ConferenceStatus.InSession;
            const expectedStatus = ConferenceStatus.Closed;
            const statusUpdate = new ConferenceStatusMessage(conferenceId, expectedStatus);

            const expectedConference = new ConferenceResponse({
                id: 'not-conference-id',
                status: existingStatus
            });

            spyOnProperty(sut, 'currentConference', 'get').and.returnValue(expectedConference);
            spyOnProperty(sut, 'currentConferenceId', 'get').and.returnValue(conferenceId);

            const expectedResult = { oldStatus: existingStatus, newStatus: expectedStatus };
            let result = null;

            sut.onCurrentConferenceStatusChanged$.subscribe(update => (result = update));

            sut.setupConferenceSubscriptions();

            // Act
            getHearingStatusMessageSubject.next(statusUpdate);
            flush();
            flush();

            // Assert
            expect(sut.currentConference.status).toEqual(expectedStatus);
            expect(result).toEqual(expectedResult);
        }));

        it('should update the current conference status and emit a message if the status is different', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const statusUpdate = new ConferenceStatusMessage(conferenceId, ConferenceStatus.Closed);

            const expectedStatus = statusUpdate.status;
            const expectedConference = new ConferenceResponse({
                id: conferenceId,
                status: expectedStatus
            });

            sut['_currentConference'] = expectedConference;
            sut['_currentConferenceId'] = conferenceId;

            // Default result from behaviour subject
            const expectedResult = {
                oldStatus: undefined,
                newStatus: null
            };
            let result = null;

            sut.onCurrentConferenceStatusChanged$.subscribe(statusUpdate => (result = statusUpdate));

            sut.setupConferenceSubscriptions();

            // Act
            getHearingStatusMessageSubject.next(statusUpdate);
            flush();
            flush();

            // Assert
            expect(sut.currentConference.status).toEqual(expectedStatus);
            expect(result).toEqual(expectedResult);
        }));

        it('should NOT update the current conference status and NOT emit a message if the status is NOT different', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const expectedStatus = ConferenceStatus.Closed;
            const statusUpdate = new ConferenceStatusMessage(conferenceId, expectedStatus);

            const expectedConference = new ConferenceResponse({
                id: conferenceId,
                status: expectedStatus
            });

            sut['_currentConference'] = expectedConference;
            sut['_currentConferenceId'] = conferenceId;

            // Default result from behaviour subject
            const expectedResult = {
                oldStatus: undefined,
                newStatus: null
            };
            let result = null;

            sut.onCurrentConferenceStatusChanged$.subscribe(statusUpdate => (result = statusUpdate));

            sut.setupConferenceSubscriptions();

            // Act
            getHearingStatusMessageSubject.next(statusUpdate);
            flush();
            flush();

            // Assert
            expect(sut.currentConference.status).toEqual(expectedStatus);
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
