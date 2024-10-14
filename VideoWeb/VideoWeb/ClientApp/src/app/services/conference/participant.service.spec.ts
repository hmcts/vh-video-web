import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import {
    ConferenceResponse,
    EndpointStatus,
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    RoomSummaryResponse,
    VideoEndpointResponse
} from '../clients/api-client';
import { EventsService } from '../events.service';
import { LoggerService } from '../logging/logger.service';
import { ParticipantStatusMessage } from '../models/participant-status-message';
import { ConferenceService } from './conference.service';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';
import { ParticipantService } from './participant.service';
import { VideoControlCacheService } from './video-control-cache.service';
import { ParticipantsUpdatedMessage } from '../../shared/models/participants-updated-message';
import { VideoCallEventsService } from 'src/app/waiting-space/services/video-call-events.service';
import { ParticipantRemoteMuteStoreService } from '../../waiting-space/services/participant-remote-mute-store.service';
import { EndpointsUpdatedMessage } from 'src/app/shared/models/endpoints-updated-message';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { UpdateEndpointsDto } from 'src/app/shared/models/update-endpoints-dto';

describe('ParticipantService', () => {
    const asParticipantModelsFromUserResponse = (participants: ParticipantForUserResponse[]) =>
        participants.map(x => ParticipantModel.fromParticipantForUserResponse(x));

    const asParticipantModelsFromEndpointResponse = (participants: VideoEndpointResponse[]) =>
        participants.map(x => ParticipantModel.fromVideoEndpointResponse(x));

    const participantOneId = Guid.create().toString();
    const participantOne = new ParticipantForUserResponse({
        id: participantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'Interpreter',
        role: Role.Individual,
        representee: null,

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

        tiled_display_name: `CIVILIAN;Interpretee;${participantTwoId}`,
        hearing_role: HearingRole.LITIGANT_IN_PERSON,
        first_name: 'Interpretee',
        last_name: 'Doe',
        interpreter_room: null,
        linked_participants: []
    });

    const vmrId = '1234';
    const vmrLabel = 'vmr-label';
    const vmrLocked = false;
    const vmrParticipantOneId = Guid.create().toString();
    const vmrParticipantOne = new ParticipantForUserResponse({
        id: vmrParticipantOneId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'PanelMember 1',
        role: Role.JudicialOfficeHolder,
        representee: null,

        tiled_display_name: `JOH;PannelMember;${vmrParticipantOneId}`,
        hearing_role: HearingRole.PANEL_MEMBER,
        first_name: 'PanelMember',
        last_name: 'One',
        interpreter_room: new RoomSummaryResponse({
            id: vmrId,
            label: vmrLabel,
            locked: vmrLocked
        }),
        linked_participants: []
    });

    const vmrParticipantTwoId = Guid.create().toString();
    const vmrParticipantTwo = new ParticipantForUserResponse({
        id: vmrParticipantTwoId,
        status: ParticipantStatus.NotSignedIn,
        display_name: 'PanelMember 2',
        role: Role.JudicialOfficeHolder,
        representee: null,

        tiled_display_name: `JOH;PannelMember;${vmrParticipantTwoId}`,
        hearing_role: HearingRole.PANEL_MEMBER,
        first_name: 'PanelMember',
        last_name: 'Two',
        interpreter_room: new RoomSummaryResponse({
            id: vmrId,
            label: vmrLabel,
            locked: vmrLocked
        }),
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

    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let getParticipantsForConferenceSubject: Subject<ParticipantModel[]>;
    let getEndpointsForConferenceSubject: Subject<ParticipantModel[]>;
    let getLoggedInParticipantForConferenceSubject: Subject<ParticipantModel>;
    let getLoggedInParticipantForConference$: Observable<ParticipantModel>;
    let currentConferenceSubject: Subject<ConferenceResponse>;
    let currentConference$: Observable<ConferenceResponse>;

    let videoCallEventsServiceSpy: jasmine.SpyObj<VideoCallEventsService>;
    let participantUpdatedSubject: Subject<ParticipantUpdated>;
    let participantUpdatedObservable: Observable<ParticipantUpdated>;

    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let participantStatusUpdateSubject: Subject<ParticipantStatusMessage>;
    let participantsUpdatedSubject: Subject<ParticipantsUpdatedMessage>;
    let endpointsUpdatedSubject: Subject<EndpointsUpdatedMessage>;
    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;

    let loggerSpy: jasmine.SpyObj<LoggerService>;

    let sut: ParticipantService;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>(
            'ConferenceService',
            ['getConferenceById', 'getParticipantsForConference', 'getEndpointsForConference', 'getLoggedInParticipantForConference'],
            ['currentConference$', 'currentConference', 'currentConferenceId']
        );
        getParticipantsForConferenceSubject = new Subject<ParticipantModel[]>();
        conferenceServiceSpy.getParticipantsForConference.and.returnValue(getParticipantsForConferenceSubject.asObservable());
        getEndpointsForConferenceSubject = new Subject<ParticipantModel[]>();
        conferenceServiceSpy.getEndpointsForConference.and.returnValue(getEndpointsForConferenceSubject.asObservable());
        getLoggedInParticipantForConferenceSubject = new Subject<ParticipantModel>();
        getLoggedInParticipantForConference$ = getLoggedInParticipantForConferenceSubject.asObservable();
        conferenceServiceSpy.getLoggedInParticipantForConference.and.returnValue(getLoggedInParticipantForConference$);

        currentConferenceSubject = new Subject<ConferenceResponse>();
        currentConference$ = currentConferenceSubject.asObservable();
        spyOn(currentConference$, 'subscribe').and.callThrough();
        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(currentConference$);

        videoCallEventsServiceSpy = jasmine.createSpyObj<VideoCallEventsService>([], ['participantUpdated$']);

        participantUpdatedSubject = new Subject<ParticipantUpdated>();
        participantUpdatedObservable = participantUpdatedSubject.asObservable();
        spyOn(participantUpdatedObservable, 'subscribe').and.callThrough();
        getSpiedPropertyGetter(videoCallEventsServiceSpy, 'participantUpdated$').and.returnValue(participantUpdatedObservable);

        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', [
            'getParticipantStatusMessage',
            'getParticipantsUpdated',
            'getEndpointsUpdated'
        ]);

        participantStatusUpdateSubject = new Subject<ParticipantStatusMessage>();
        eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusUpdateSubject.asObservable());
        participantsUpdatedSubject = new Subject<ParticipantsUpdatedMessage>();
        eventsServiceSpy.getParticipantsUpdated.and.returnValue(participantsUpdatedSubject.asObservable());
        endpointsUpdatedSubject = new Subject<EndpointsUpdatedMessage>();
        eventsServiceSpy.getEndpointsUpdated.and.returnValue(endpointsUpdatedSubject.asObservable());

        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', [
            'setSpotlightStatus',
            'getSpotlightStatus'
        ]);

        loggerSpy = jasmine.createSpyObj<LoggerService>('Logger', ['error', 'warn', 'info', 'debug']);
        const participantRemoteMuteStoreServiceSpy = jasmine.createSpyObj<ParticipantRemoteMuteStoreService>(
            ['updateRemoteMuteStatus', 'updateLocalMuteStatus', 'assignPexipId'],
            ['conferenceParticipantsStatus$']
        );

        sut = new ParticipantService(
            conferenceServiceSpy,
            videoCallEventsServiceSpy,
            eventsServiceSpy,
            videoControlCacheServiceSpy,
            participantRemoteMuteStoreServiceSpy,
            loggerSpy
        );
    });

    describe('construction', () => {
        it('should not get participants or subscribe to conference events if the conference is falsey', fakeAsync(() => {
            // Act
            const conference = new ConferenceResponse();
            conference.id = 'conference-id';
            currentConferenceSubject.next(null);
            flush();

            // Assert
            expect(sut).toBeTruthy();
            expect(conferenceServiceSpy.getParticipantsForConference).not.toHaveBeenCalled();
            expect(conferenceServiceSpy.getEndpointsForConference).not.toHaveBeenCalled();
        }));

        it('should be created and the initialise participant list', fakeAsync(() => {
            // Arrange
            const participantResponses = [participantOne, participantTwo];
            const endpointResponses = [endpointOne, endpointTwo];

            let result = [];
            sut.onParticipantsLoaded$.subscribe(participants => (result = participants));

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(false);

            // Act
            const conference = new ConferenceResponse();
            conference.id = 'conference-id';
            currentConferenceSubject.next(conference);
            flush();
            getParticipantsForConferenceSubject.next(asParticipantModelsFromUserResponse(participantResponses));
            getEndpointsForConferenceSubject.next(asParticipantModelsFromEndpointResponse(endpointResponses));
            flush();

            // Assert
            expect(sut).toBeTruthy();
            expect(sut.participants).toEqual(
                participantResponses
                    .map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
                    .concat(endpointResponses.map(endpointResponse => ParticipantModel.fromVideoEndpointResponse(endpointResponse)))
            );
            expect(result).toEqual([
                ...participantResponses.map(x => ParticipantModel.fromParticipantForUserResponse(x)),
                ...endpointResponses.map(x => ParticipantModel.fromVideoEndpointResponse(x))
            ]);
        }));

        it('restore the cached video state for a participant', fakeAsync(() => {
            // Arrange
            const participantResponses = [participantOne, participantTwo];
            const endpointResponses = [endpointOne, endpointTwo];

            const conference = new ConferenceResponse();
            conference.id = 'conference-id';

            videoControlCacheServiceSpy.getSpotlightStatus.withArgs(participantOneId).and.returnValue(true);
            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(false);

            // Act
            currentConferenceSubject.next(conference);
            flush();
            getParticipantsForConferenceSubject.next(asParticipantModelsFromUserResponse(participantResponses));
            getEndpointsForConferenceSubject.next(asParticipantModelsFromEndpointResponse(endpointResponses));
            flush();

            // Assert
            expect(sut.participants.find(p => p.id === participantOneId).isSpotlighted).toBeTrue();
        }));

        it('restore the cached video state for a vmr', fakeAsync(() => {
            // Arrange
            const participantResponses = [vmrParticipantOne, vmrParticipantTwo, participantTwo];
            const endpointResponses = [endpointOne, endpointTwo];

            const conference = new ConferenceResponse();
            conference.id = 'conference-id';

            videoControlCacheServiceSpy.getSpotlightStatus.withArgs(vmrId).and.returnValue(true);
            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(false);

            // Act
            currentConferenceSubject.next(conference);
            flush();
            getParticipantsForConferenceSubject.next(asParticipantModelsFromUserResponse(participantResponses));
            getEndpointsForConferenceSubject.next(asParticipantModelsFromEndpointResponse(endpointResponses));
            flush();

            // Assert
            expect(sut.participants.find(p => p.id === vmrParticipantOneId).isSpotlighted).toBeTrue();
            expect(sut.participants.find(p => p.id === vmrParticipantTwoId).isSpotlighted).toBeTrue();
        }));

        it('should subscribe to onParticipantUpdated', fakeAsync(() => {
            // Act
            const participantResponses = [participantOne, participantTwo];
            getParticipantsForConferenceSubject.next(asParticipantModelsFromUserResponse(participantResponses));
            getEndpointsForConferenceSubject.next(asParticipantModelsFromEndpointResponse([]));
            flush();

            // Assert
            expect(participantUpdatedObservable.subscribe).toHaveBeenCalledTimes(1);
        }));

        it('should subscribe to currentConference$', fakeAsync(() => {
            // Assert
            expect(currentConference$.subscribe).toHaveBeenCalledTimes(1);
        }));
    });

    describe('get Participants ', () => {
        it('should return combination of endpoint and non-endpoint participants', () => {
            // Arrange

            const participants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            const endpointParticipants = [endpointOne, endpointTwo].map(x => ParticipantModel.fromVideoEndpointResponse(x));
            const allParticipants = [...participants, ...endpointParticipants];
            spyOnProperty(sut, 'endpointParticipants', 'get').and.returnValue(endpointParticipants);
            spyOnProperty(sut, 'nonEndpointParticipants', 'get').and.returnValue(participants);

            // Act
            const result = sut.participants;

            expect(result.length).toEqual(allParticipants.length);
            expect(result).toEqual(allParticipants);
        });
    });

    describe('handle current conference changed', () => {
        it('should call get participants and end points and subscribe to the relevant conference events', fakeAsync(() => {
            // Arrange
            const participantStatusUpdate$ = new Observable<ParticipantStatusMessage>();
            const participantsUpdated$ = new Observable<ParticipantsUpdatedMessage>();
            const endpointsUpdated$ = new Observable<EndpointsUpdatedMessage>();
            const expectedUnsubscribed = [
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']),
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']),
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']),
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe'])
            ];
            const expectedSubscriptions = [
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']),
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']),
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe']),
                jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe'])
            ];
            spyOn(participantStatusUpdate$, 'subscribe').and.returnValues(expectedUnsubscribed[0], expectedSubscriptions[0]);
            spyOn(getLoggedInParticipantForConference$, 'subscribe').and.returnValues(expectedUnsubscribed[1], expectedSubscriptions[1]);
            spyOn(participantsUpdated$, 'subscribe').and.returnValues(expectedUnsubscribed[2], expectedSubscriptions[2]);

            spyOn(participantStatusUpdateSubject, 'asObservable').and.returnValue(participantStatusUpdate$);
            eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusUpdateSubject.asObservable());

            spyOn(participantsUpdatedSubject, 'asObservable').and.returnValue(participantsUpdated$);
            eventsServiceSpy.getParticipantsUpdated.and.returnValue(participantsUpdatedSubject.asObservable());

            spyOn(endpointsUpdated$, 'subscribe').and.returnValues(expectedUnsubscribed[3], expectedSubscriptions[3]);
            spyOn(endpointsUpdatedSubject, 'asObservable').and.returnValue(endpointsUpdated$);
            eventsServiceSpy.getEndpointsUpdated.and.returnValue(endpointsUpdatedSubject.asObservable());

            const conferenceIdOne = 'conference-id-one';
            const conferenceIdTwo = 'conference-id-two';
            const conference = new ConferenceResponse();
            conference.id = conferenceIdOne;

            // Act
            currentConferenceSubject.next(conference);
            flush();

            conference.id = conferenceIdTwo;
            currentConferenceSubject.next(conference);
            flush();

            // Assert
            expectedUnsubscribed.forEach(x => expect(x.unsubscribe).toHaveBeenCalledTimes(1));
            expect(sut['conferenceSubscriptions'].length).toEqual(expectedSubscriptions.length);
            expect(participantStatusUpdate$.subscribe).toHaveBeenCalledTimes(2);
        }));

        it('should populate the virtual meeting rooms when get participants and get endpoints resolve', fakeAsync(() => {
            // Arrange
            const conferenceIdOne = 'conference-id-one';
            const conference = new ConferenceResponse();
            conference.id = conferenceIdOne;

            const nonVmrParticipants = [participantOne, participantTwo];
            const nonVmrEndpoints = [endpointOne, endpointTwo];
            const vmrParticipants = [vmrParticipantOne, vmrParticipantTwo];
            const expectedParticipants = nonVmrParticipants
                .concat(vmrParticipants)
                .map(x => ParticipantModel.fromParticipantForUserResponse(x))
                .concat(nonVmrEndpoints.map(x => ParticipantModel.fromVideoEndpointResponse(x)));

            const expectedVmrs = [
                new VirtualMeetingRoomModel(
                    vmrId,
                    vmrLabel,
                    vmrLocked,
                    vmrParticipants.map(x => ParticipantModel.fromParticipantForUserResponse(x))
                )
            ];

            // Act
            currentConferenceSubject.next(conference);
            flush();

            expect(sut.participants.length).toEqual(0);
            expect(sut.virtualMeetingRooms.length).toEqual(0);

            getParticipantsForConferenceSubject.next(asParticipantModelsFromUserResponse([...nonVmrParticipants, ...vmrParticipants]));
            getEndpointsForConferenceSubject.next(asParticipantModelsFromEndpointResponse(nonVmrEndpoints));
            flush();

            expect(sut.participants.length).toEqual(expectedParticipants.length);
            // We can't do a deep comparison due to the link Participant <-> VMR
            expectedParticipants.forEach(x => expect(sut.participants.find(y => y.id === x.id)).toBeTruthy());

            expect(sut.virtualMeetingRooms.length).toEqual(expectedVmrs.length);
            // We can't do a deep comparison due to the link Participant <-> VMR
            // Check if all the vmrs are there
            expectedVmrs.forEach(x => expect(sut.virtualMeetingRooms.find(y => y.id === x.id)).toBeTruthy());

            // Check the participants where linked
            sut.virtualMeetingRooms.forEach(x => {
                const expectedX = expectedVmrs.find(y => y.id === x.id);
                expectedX.participants.forEach(p => expect(x.participants.find(z => z.id === p.id)).toBeTruthy());
            });
        }));
    });

    describe('handle participants updated', () => {
        const conference = new ConferenceResponse();
        conference.id = 'TestId';

        const participantResponse1 = new ParticipantResponse();
        participantResponse1.id = 'TestId1';
        const participantResponse2 = new ParticipantResponse();
        participantResponse2.id = 'TestId2';
        const participants = [participantResponse1, participantResponse2];

        const participantModel1 = new ParticipantModel(
            'TestId1',
            'TestName1',
            'TestDisplayName1',
            'ROLE;HEARTBEAT;DISPLAY NAME;ID',
            Role.JudicialOfficeHolder,
            'TestHearingRole1',
            true,
            new RoomSummaryResponse(),
            [],
            ParticipantStatus.Available,
            new RoomSummaryResponse(),
            'TestPexipId1',
            true,
            true,
            true,
            true,
            true
        );
        const participantModel2 = new ParticipantModel(
            'TestId2',
            'TestName2',
            'TestDisplayName2',
            'ROLE;HEARTBEAT;DISPLAY NAME;ID',
            Role.JudicialOfficeHolder,
            'TestHearingRole2',
            false,
            new RoomSummaryResponse(),
            [],
            ParticipantStatus.Available,
            new RoomSummaryResponse(),
            'TestPexipId2',
            false,
            false,
            false,
            false,
            false
        );

        let originalNonEndpointParticipants: ParticipantModel[];
        const particpantModels = [participantModel1, participantModel2];

        let participantsUpdatedEmitted: boolean;
        beforeEach(() => {
            currentConferenceSubject.next(conference);
            participantsUpdatedEmitted = false;
            sut.onParticipantsUpdated$.subscribe(x => {
                participantsUpdatedEmitted = true;
            });
            spyOn(ParticipantModel, 'fromParticipantResponseVho')
                .withArgs(participantResponse1)
                .and.returnValue(participantModel1)
                .withArgs(participantResponse2)
                .and.returnValue(participantModel2);
            originalNonEndpointParticipants = sut.nonEndpointParticipants;
        });
        it('should set participants with updated value', () => {
            const message = new ParticipantsUpdatedMessage(conference.id, participants);
            participantsUpdatedSubject.next(message);
            expect(participantsUpdatedEmitted).toBe(true);
            expect(sut.nonEndpointParticipants).toEqual(particpantModels);
        });

        it('should not set participants when conference id does not match', () => {
            const message = new ParticipantsUpdatedMessage('Something Else', participants);
            participantsUpdatedSubject.next(message);
            expect(participantsUpdatedEmitted).toBe(false);
            expect(sut.nonEndpointParticipants).toBe(originalNonEndpointParticipants);
        });
    });

    describe('handle endpoints updated', () => {
        let testConference: ConferenceResponse;
        let existingEndpoints: VideoEndpointResponse[];

        beforeEach(() => {
            testConference = new ConferenceTestData().getConferenceDetailNow();
            conferenceServiceSpy.getParticipantsForConference.and.returnValue(
                of(asParticipantModelsFromUserResponse(testConference.participants))
            );
            conferenceServiceSpy.getEndpointsForConference.and.returnValue(
                of(asParticipantModelsFromEndpointResponse(testConference.endpoints))
            );

            existingEndpoints = testConference.endpoints;
            currentConferenceSubject.next(testConference);
        });
        it('should set endpoints with updated value', fakeAsync(() => {
            // arrange
            const beforeUpdateCount = existingEndpoints.length;
            const newEndpoint = new VideoEndpointResponse({
                id: 'TestId1',
                display_name: 'TestName1NewAddedViaMessage',
                status: EndpointStatus.NotYetJoined,
                defence_advocate_username: 'TestUsername1',
                pexip_display_name: 'TestPexipDisplayName1'
            });

            const updatedDto: UpdateEndpointsDto = {
                existing_endpoints: [],
                removed_endpoints: [],
                new_endpoints: [newEndpoint]
            };
            const message = new EndpointsUpdatedMessage(testConference.id, updatedDto);

            // act
            endpointsUpdatedSubject.next(message);
            // currently the service only publishes one message per update or add
            existingEndpoints.forEach(x => {
                const dto: UpdateEndpointsDto = {
                    existing_endpoints: [x],
                    removed_endpoints: [],
                    new_endpoints: []
                };
                const updatedEndpointMessage = new EndpointsUpdatedMessage(testConference.id, dto);
                endpointsUpdatedSubject.next(updatedEndpointMessage);
            });
            tick();

            // assert
            expect(sut.endpointParticipants.length).toBe(beforeUpdateCount + 1);
            existingEndpoints.forEach(x =>
                expect(sut.endpointParticipants).toContain(jasmine.objectContaining({ displayName: x.display_name }))
            );
            expect(sut.endpointParticipants).toContain(jasmine.objectContaining({ displayName: newEndpoint.display_name }));
        }));
    });

    describe('getPexipIdForParticipant', () => {
        it('should return the pexip id for the given participant id', () => {
            // Arrange
            const pexipId = 'pexip-id';
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            const participantId = participant.id;
            participant.pexipId = pexipId;

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toEqual(pexipId);
        });

        it('should return the pexip id for the given participant id when participant id is a guid', () => {
            // Arrange
            const pexipId = 'pexip-id';
            const participantId = Guid.create();
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            participant.id = participantId.toString();
            participant.pexipId = pexipId;

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toEqual(pexipId);
        });

        it('should return null the participant does not exist', () => {
            // Act
            const result = sut.getPexipIdForParticipant('participant-id');

            // Assert
            expect(result).toBe(null);
        });

        it('should return null if the pexip id is null', () => {
            // Arrange
            const pexipId = 'pexip-id';
            const participantId = Guid.create();
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            participant.id = participantId.toString();
            participant.pexipId = null;

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toBe(null);
        });

        it('should return null if the pexip id is undefined', () => {
            // Arrange
            const pexipId = 'pexip-id';
            const participantId = Guid.create();
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            participant.id = participantId.toString();
            participant.pexipId = undefined;

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toBe(null);
        });
    });

    describe('handlePexipParticipantUpdates', () => {
        describe('maintains pexip id map', () => {
            it('should set a second pexip ID when the event is raised again', () => {
                // Arrange
                const pexipIdOne = 'pexip-id-one';
                const pexipIdTwo = 'pexip-id-two';
                const pexipNameOne = `pexip-name-${participantOneId}`;
                const pexipNameTwo = `pexip-name-${participantTwoId}`;

                const participantUpdatedOne = {
                    pexipDisplayName: pexipNameOne,
                    uuid: pexipIdOne
                } as unknown as ParticipantUpdated;

                const participantUpdatedTwo = {
                    pexipDisplayName: pexipNameTwo,
                    uuid: pexipIdTwo
                } as unknown as ParticipantUpdated;

                spyOnProperty(sut, 'participants', 'get').and.returnValue(
                    asParticipantModelsFromUserResponse([participantOne, participantTwo])
                );

                // Act
                sut.handlePexipUpdate(participantUpdatedOne);
                sut.handlePexipUpdate(participantUpdatedTwo);

                // Assert
                expect(sut.participants[0].pexipId).toEqual(pexipIdOne);
                expect(sut.participants[1].pexipId).toEqual(pexipIdTwo);
            });

            it('should update an existing ID when the event is raised again', () => {
                // Arrange
                const pexipIdOne = 'pexip-id-one';
                const pexipIdTwo = 'pexip-id-two';
                const pexipIdThree = 'pexip-id-three';
                const pexipNameOne = `pexip-name-${participantOneId}`;
                const pexipNameTwo = `pexip-name-${participantTwoId}`;

                const participantUpdatedOne = {
                    pexipDisplayName: pexipNameOne,
                    uuid: pexipIdOne
                } as unknown as ParticipantUpdated;

                const participantUpdatedTwo = {
                    pexipDisplayName: pexipNameTwo,
                    uuid: pexipIdTwo
                } as unknown as ParticipantUpdated;

                const participantUpdatedThree = {
                    pexipDisplayName: pexipNameOne,
                    uuid: pexipIdThree
                } as unknown as ParticipantUpdated;

                spyOnProperty(sut, 'participants', 'get').and.returnValue(
                    asParticipantModelsFromUserResponse([participantOne, participantTwo])
                );

                // Act
                sut.handlePexipUpdate(participantUpdatedOne);
                sut.handlePexipUpdate(participantUpdatedTwo);
                sut.handlePexipUpdate(participantUpdatedThree);

                // Assert
                expect(sut.participants[0].pexipId).toEqual(pexipIdThree);
                expect(sut.participants[1].pexipId).toEqual(pexipIdTwo);
            });

            it('should NOT set an ID if the participant cannot be found', () => {
                // Arrange
                const pexipId = 'pexip-id';
                const participantId = Guid.create().toString();
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown as ParticipantUpdated;

                const expectedValue: { [participantId: string]: string } = {};

                spyOnProperty(sut, 'participants', 'get').and.returnValue(
                    asParticipantModelsFromUserResponse([participantOne, participantTwo])
                );
                spyOnProperty(sut, 'virtualMeetingRooms', 'get').and.returnValue([]);

                // Act
                sut.handlePexipUpdate(participantUpdated);

                // Assert
                expect(sut.participants[0].pexipId).toEqual(null);
                expect(sut.participants[1].pexipId).toEqual(null);
            });

            it('should update the pexip id map for VMR participants', () => {
                // Arrange
                const pexipId = 'pexip-id';
                const pexipName = `pexip-name-${vmrId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown as ParticipantUpdated;

                const participants = asParticipantModelsFromUserResponse([
                    participantOne,
                    participantTwo,
                    vmrParticipantOne,
                    vmrParticipantTwo
                ]);
                const vmr = VirtualMeetingRoomModel.fromRoomSummaryResponse(participants[2].virtualMeetingRoomSummary);
                vmr.pexipId = pexipId;
                vmr.participants = [participants[2], participants[3]];

                spyOnProperty(sut, 'participants', 'get').and.returnValue(participants);
                spyOnProperty(sut, 'virtualMeetingRooms', 'get').and.returnValue([vmr]);

                // Act
                sut.handlePexipUpdate(participantUpdated);

                // Assert
                expect(participants[2].pexipId).toEqual(pexipId);
                expect(participants[3].pexipId).toEqual(pexipId);
            });
        });

        describe('raises relevant events', () => {
            it('should raise participant connected to pexip event when it is their first id', fakeAsync(() => {
                // Arrange
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const newPexipId = 'new-pexip-id';
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: newPexipId
                } as unknown as ParticipantUpdated;
                participant.pexipId = null;

                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                let connectedResult = null;
                sut.onParticipantConnectedToPexip$.subscribe(connectedParticipant => (connectedResult = connectedParticipant));

                let changedResult = null;
                sut.onParticipantPexipIdChanged$.subscribe(changedParticipant => (changedResult = changedParticipant));

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();

                // Assert
                expect(sut.participants[0].pexipId).toEqual(newPexipId);
                expect(connectedResult).toBe(participant);
                expect(changedResult).toBeNull();
            }));

            it('should raise participant pexip id changed event when it is NOT their first id', fakeAsync(() => {
                // Arrange
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const newPexipId = 'new-pexip-id';
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: newPexipId
                } as unknown as ParticipantUpdated;
                participant.pexipId = 'old-pexip-id';

                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                let connectedResult = null;
                sut.onParticipantConnectedToPexip$.subscribe(connectedParticipant => (connectedResult = connectedParticipant));

                let changedResult = null;
                sut.onParticipantPexipIdChanged$.subscribe(changedParticipant => (changedResult = changedParticipant));

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();

                // Assert
                expect(sut.participants[0].pexipId).toEqual(newPexipId);
                expect(connectedResult).toBeNull();
                expect(changedResult).toBe(participant);
            }));

            it('should raise VMR connected changed event when it is their first id', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const pexipName = `pexip-name-${vmrId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown as ParticipantUpdated;

                const participants = asParticipantModelsFromUserResponse([
                    participantOne,
                    participantTwo,
                    vmrParticipantOne,
                    vmrParticipantTwo
                ]);
                const vmr = VirtualMeetingRoomModel.fromRoomSummaryResponse(participants[2].virtualMeetingRoomSummary);
                vmr.pexipId = null;
                vmr.participants = [participants[2], participants[3]];

                spyOnProperty(sut, 'participants', 'get').and.returnValue(participants);
                spyOnProperty(sut, 'virtualMeetingRooms', 'get').and.returnValue([vmr]);

                let i = 0;
                const participantConnectedResults = [null, null];
                sut.onParticipantConnectedToPexip$.subscribe(participant => (participantConnectedResults[i++] = participant));

                let j = 0;
                const participantChangedResults = [null, null];
                sut.onParticipantPexipIdChanged$.subscribe(participant => (participantChangedResults[j++] = participant));

                let vmrConnectedResult = null;
                sut.onVmrConnectedToPexip$.subscribe(connectedVmr => (vmrConnectedResult = connectedVmr));

                let vmrChangedResult = null;
                sut.onVmrPexipIdChanged$.subscribe(changedVmr => (vmrChangedResult = changedVmr));

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();

                // Assert
                expect(vmrConnectedResult).toBe(vmr);
                expect(vmrChangedResult).toBeNull();
                expect(participants[2].pexipId).toBeNull();
                expect(participants[3].pexipId).toBeNull();
                expect(participantConnectedResults[0]).toBeNull();
                expect(participantConnectedResults[1]).toBeNull();
                expect(participantChangedResults[0]).toBeNull();
                expect(participantChangedResults[1]).toBeNull();
            }));

            it('should raise VMR updated and participant updated event when it is their first id', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const pexipName = `pexip-name-${vmrId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown as ParticipantUpdated;

                const participants = asParticipantModelsFromUserResponse([
                    participantOne,
                    participantTwo,
                    vmrParticipantOne,
                    vmrParticipantTwo
                ]);
                const vmr = VirtualMeetingRoomModel.fromRoomSummaryResponse(participants[2].virtualMeetingRoomSummary);
                vmr.pexipId = 'existing-pexip-id';
                vmr.participants = [participants[2], participants[3]];
                vmr.participants.forEach(x => (x.pexipId = 'existing-pexip-id'));

                spyOnProperty(sut, 'participants', 'get').and.returnValue(participants);
                spyOnProperty(sut, 'virtualMeetingRooms', 'get').and.returnValue([vmr]);

                let i = 0;
                const participantConnectedResults = [null, null];
                sut.onParticipantConnectedToPexip$.subscribe(participant => (participantConnectedResults[i++] = participant));

                let j = 0;
                const participantChangedResults = [null, null];
                sut.onParticipantPexipIdChanged$.subscribe(participant => (participantChangedResults[j++] = participant));

                let vmrConnectedResult = null;
                sut.onVmrConnectedToPexip$.subscribe(connectedVmr => (vmrConnectedResult = connectedVmr));

                let vmrChangedResult = null;
                sut.onVmrPexipIdChanged$.subscribe(changedVmr => (vmrChangedResult = changedVmr));

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();

                // Assert
                expect(vmrConnectedResult).toBeNull();
                expect(vmrChangedResult).toBe(vmr);
                expect(participants[2].pexipId).toBe(pexipId);
                expect(participants[3].pexipId).toBe(pexipId);
                expect(participantConnectedResults[0]).toBeNull();
                expect(participantConnectedResults[1]).toBeNull();
                expect(participantChangedResults[0]).toBe(vmr.participants[0]);
                expect(participantChangedResults[1]).toBe(vmr.participants[1]);
            }));
        });

        describe('handles spotlight status changes', () => {
            it('should emit an onParticipantSpotlightStatusChanged event when a participants spotlight status changes', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isSpotlighted: true
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantSpotlightStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isSpotlighted = false;
                participant.pexipId = pexipId;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).not.toBeNull();
                expect(result.isSpotlighted).toBeTrue();
                expect(result.id).toBe(participantId);
                expect(participant.isSpotlighted).toBeTrue();
            }));

            it('should NOT emit an onParticipantSpotlightStatusChanged event when a participants spotlight status does NOT change', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isSpotlighted: true
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantSpotlightStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isSpotlighted = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isSpotlighted).toBeTrue();
            }));

            it('should NOT change the participants spotlight status if the participant has been assigned their first pexip id', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isSpotlighted: false
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantHandRaisedStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isSpotlighted = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isSpotlighted).toBeTrue();
            }));
        });

        describe('handles remote muted status changes', () => {
            it('should emit an onParticipantRemoteMuteStatusChanged event when a participants remote mute status changes', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isRemoteMuted: true
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantRemoteMuteStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isRemoteMuted = false;
                participant.pexipId = pexipId;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).not.toBeNull();
                expect(result.isRemoteMuted).toBeTrue();
                expect(result.id).toBe(participantId);
                expect(participant.isRemoteMuted).toBeTrue();
            }));

            it('should NOT emit an onParticipantRemoteMuteStatusChanged event when a participants remote mute status does NOT change', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isRemoteMuted: true
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantRemoteMuteStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isRemoteMuted = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isRemoteMuted).toBeTrue();
            }));

            it('should NOT change the participants remote mute status if the participant has been assigned their first pexip id', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isRemoteMuted: false
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantHandRaisedStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isRemoteMuted = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isRemoteMuted).toBeTrue();
            }));
        });

        describe('handles hand raised status changes', () => {
            it('should emit an onParticipantHandRaisedStatusChanged event when a participants hand raised status changes', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    handRaised: true
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantRemoteMuteStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isHandRaised = false;
                participant.pexipId = pexipId;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).not.toBeNull();
                expect(result.isHandRaised).toBeTrue();
                expect(result.id).toBe(participantId);
                expect(participant.isHandRaised).toBeTrue();
            }));

            it('should NOT emit an onParticipantHandRaisedStatusChanged event when a participants hand raised status does NOT change', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    handRaised: true
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantHandRaisedStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isHandRaised = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isHandRaised).toBeTrue();
            }));

            it('should NOT change the participants hand raised status if the participant has been assigned their first pexip id', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = {
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    handRaised: false
                } as unknown as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantHandRaisedStatusChanged$.subscribe(spotlightUpdate => {
                    result = spotlightUpdate;
                });

                participant.isHandRaised = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isHandRaised).toBeTrue();
            }));
        });

        it('should not action when pexip display name is undefined', () => {
            // Arrange
            const participantUpdated: ParticipantUpdated = {
                pexipDisplayName: undefined,
                uuid: undefined,
                callTag: undefined,
                isRemoteMuted: false,
                isSpotlighted: false,
                handRaised: false,
                isAudioOnlyCall: false,
                isVideoCall: false,
                protocol: '',
                receivingAudioMix: 'main',
                sentAudioMixes: [{ mix_name: 'main', prominent: false }]
            };

            // Act
            sut.handlePexipUpdate(participantUpdated);

            // Assert
            expect(sut.participants.length).toBe(0);
        });
    });

    describe('handleParticipantStatusChange', () => {
        it('should update the status if it is different and emit onParticipantStatusChanged event', fakeAsync(() => {
            // Arrange
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            const participantId = participant.id;
            const conferenceId = 'conference-id';
            const participantStatusMessage = new ParticipantStatusMessage(participantId, '', conferenceId, ParticipantStatus.Available);

            participant.status = ParticipantStatus.Joining;
            spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

            let result = null;
            // Act
            sut.onParticipantStatusChanged$.subscribe(spotlightUpdate => (result = spotlightUpdate));
            sut.handleParticipantStatusUpdate(participantStatusMessage);
            flush();

            // Assert
            expect(result).not.toBeNull();
            expect(result.status).toEqual(ParticipantStatus.Available);
            expect(result.id).toBe(participantId);
            expect(participant.status).toEqual(ParticipantStatus.Available);
        }));

        it('should NOT update the status if it is NOT different and should NOT emit onParticipantStatusChanged event', fakeAsync(() => {
            // Arrange
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            const participantId = participant.id;
            const conferenceId = 'conference-id';
            const participantStatusMessage = new ParticipantStatusMessage(participantId, '', conferenceId, ParticipantStatus.Joining);

            participant.status = ParticipantStatus.Joining;
            spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

            let result = null;
            // Act
            sut.onParticipantStatusChanged$.subscribe(spotlightUpdate => (result = spotlightUpdate));
            sut.handleParticipantStatusUpdate(participantStatusMessage);
            flush();

            // Assert
            expect(result).toBeNull();
            expect(participant.status).toEqual(ParticipantStatus.Joining);
        }));

        it('should NOT update the status and should NOT emit onParticipantStatusChanged event if the participant cannot be found', fakeAsync(() => {
            // Arrange
            const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
            const participantId = participant.id;
            const conferenceId = 'conference-id';
            const participantStatusMessage = new ParticipantStatusMessage(participantId, '', conferenceId, ParticipantStatus.Joining);

            spyOnProperty(sut, 'participants', 'get').and.returnValue([]);

            let result = null;
            // Act
            sut.onParticipantStatusChanged$.subscribe(spotlightUpdate => (result = spotlightUpdate));
            sut.handleParticipantStatusUpdate(participantStatusMessage);
            flush();

            // Assert
            expect(result).toBeNull();
        }));
    });
});
