import { fakeAsync, flush } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Observable, Subject, Subscription } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import {
    ApiClient,
    ConferenceResponse,
    EndpointStatus,
    ParticipantForUserResponse,
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
import { InvalidNumberOfNonEndpointParticipantsError, ParticipantService } from './participant.service';

fdescribe('ParticipantService', () => {
    const asParticipantModels = (participants: ParticipantForUserResponse[]) =>
        participants.map(x => ParticipantModel.fromParticipantForUserResponse(x));

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
        case_type_group: 'PanelMember',
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
        case_type_group: 'PanelMember',
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

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let getParticipantsByConferenceId$: Subject<ParticipantForUserResponse[]>;
    let getEndpointsByConferenceId$: Subject<VideoEndpointResponse[]>;

    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let currentConferenceSubject: Subject<ConferenceResponse>;

    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let participantUpdatedSubject: Subject<ParticipantUpdated>;
    let participantUpdated$: Observable<ParticipantUpdated>;

    let eventsServiceSpy: jasmine.SpyObj<EventsService>;
    let participantStatusUpdateSubject: Subject<ParticipantStatusMessage>;

    let loggerSpy: jasmine.SpyObj<LoggerService>;

    let sut: ParticipantService;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getParticipantsByConferenceId', 'getVideoEndpointsForConference']);

        getParticipantsByConferenceId$ = new Subject<ParticipantForUserResponse[]>();
        getEndpointsByConferenceId$ = new Subject<VideoEndpointResponse[]>();
        apiClientSpy.getParticipantsByConferenceId.and.returnValue(getParticipantsByConferenceId$.asObservable());
        apiClientSpy.getVideoEndpointsForConference.and.returnValue(getEndpointsByConferenceId$.asObservable());

        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>('ConferenceService', ['getConferenceById'], ['currentConference$']);

        currentConferenceSubject = new Subject<ConferenceResponse>();
        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(currentConferenceSubject.asObservable());

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['onParticipantUpdated']);

        participantUpdatedSubject = new Subject<ParticipantUpdated>();
        participantUpdated$ = participantUpdatedSubject.asObservable();
        spyOn(participantUpdated$, 'subscribe').and.callThrough();
        videoCallServiceSpy.onParticipantUpdated.and.returnValue(participantUpdated$);

        eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['getParticipantStatusMessage']);

        participantStatusUpdateSubject = new Subject<ParticipantStatusMessage>();
        eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusUpdateSubject.asObservable());

        loggerSpy = jasmine.createSpyObj<LoggerService>('Logger', ['error', 'warn', 'info']);

        sut = new ParticipantService(apiClientSpy, conferenceServiceSpy, videoCallServiceSpy, eventsServiceSpy, loggerSpy);

        apiClientSpy.getParticipantsByConferenceId.calls.reset();
    });

    describe('construction', () => {
        it('should be created and the initialise participant list', fakeAsync(() => {
            // Arrange
            const participantResponses = [participantOne, participantTwo];
            const endpointResponses = [endpointOne, endpointTwo];

            // Act
            const conference = new ConferenceResponse();
            conference.id = 'conference-id';
            currentConferenceSubject.next(conference);
            flush();

            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            getEndpointsByConferenceId$.next(endpointResponses);
            flush();

            // Assert
            expect(sut).toBeTruthy();
            expect(sut.participants).toEqual(
                participantResponses
                    .map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
                    .concat(endpointResponses.map(endpointResponse => ParticipantModel.fromVideoEndpointResponse(endpointResponse)))
            );
        }));

        it('should subscribe to onParticipantUpdated', fakeAsync(() => {
            // Arrange
            videoCallServiceSpy.onParticipantUpdated.and.returnValue(participantUpdated$);

            // Act
            const participantResponses = [participantOne, participantTwo];
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(videoCallServiceSpy.onParticipantUpdated).toHaveBeenCalledTimes(1);
            expect(participantUpdated$.subscribe).toHaveBeenCalledTimes(1);
        }));

        it('should subscribe to currentConference; then get participants for conference each time a value is emmited and setup conference specific subscribers', fakeAsync(() => {
            // Arrange
            const getParticipantsForConferenceSpy = spyOn(sut, 'getParticipantsForConference').and.callThrough();
            const getEndpointsForConferenceSpy = spyOn(sut, 'getEndpointsForConference').and.callThrough();

            const participantStatusUpdate$ = new Observable<ParticipantStatusMessage>();
            const expectedUnsubscribed = [jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe'])];
            const expectedSubscriptions = [jasmine.createSpyObj<Subscription>('Subscription', ['unsubscribe'])];
            spyOn(participantStatusUpdate$, 'subscribe').and.returnValues(...expectedUnsubscribed, ...expectedSubscriptions);

            spyOn(participantStatusUpdateSubject, 'asObservable').and.returnValue(participantStatusUpdate$);
            eventsServiceSpy.getParticipantStatusMessage.and.returnValue(participantStatusUpdateSubject.asObservable());

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
            expect(getParticipantsForConferenceSpy).toHaveBeenCalledTimes(2);
            expect(getParticipantsForConferenceSpy).toHaveBeenCalledWith(conferenceIdOne);
            expect(getParticipantsForConferenceSpy).toHaveBeenCalledWith(conferenceIdTwo);
            expect(getEndpointsForConferenceSpy).toHaveBeenCalledTimes(2);
            expect(getEndpointsForConferenceSpy).toHaveBeenCalledWith(conferenceIdOne);
            expect(getEndpointsForConferenceSpy).toHaveBeenCalledWith(conferenceIdTwo);
            expectedUnsubscribed.forEach(x => expect(x.unsubscribe).toHaveBeenCalledTimes(1));
            expect(sut['conferenceSubscriptions'].length).toEqual(expectedSubscriptions.length);
            expect(participantStatusUpdate$.subscribe).toHaveBeenCalledTimes(2);
        }));
    });

    describe('get endpointParticipants', () => {
        it('should return an empty array if there are no endpoints', () => {
            // Arrange
            const participants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            spyOnProperty(sut, 'participants', 'get').and.returnValue(participants);

            // Act
            const result = sut.endpointParticipants;

            // Assert
            expect(result.length).toEqual(0);
        });

        it('should only return endpoints', () => {
            // Arrange
            const participants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            const endpointParticipants = [endpointOne, endpointTwo].map(x => ParticipantModel.fromVideoEndpointResponse(x));
            spyOnProperty(sut, 'participants', 'get').and.returnValue(participants.concat(endpointParticipants));

            // Act
            const result = sut.endpointParticipants;

            // Assert
            expect(result.length).toEqual(endpointParticipants.length);
            participants.forEach(x => expect(result).not.toContain(x));
            endpointParticipants.forEach(x => expect(result).toContain(x));
        });
    });

    describe('get nonEndpointParticipants', () => {
        it('should throw if there are no non-endpoints as this should NOT be possible', () => {
            // Arrange
            const endpointParticipants = [endpointOne, endpointTwo].map(x => ParticipantModel.fromVideoEndpointResponse(x));
            spyOnProperty(sut, 'participants', 'get').and.returnValue(endpointParticipants);

            // Act & Assert
            expect(() => sut.nonEndpointParticipants).toThrow(InvalidNumberOfNonEndpointParticipantsError());
        });

        it('should only return endpoints', () => {
            // Arrange
            const participants = [participantOne, participantTwo].map(x => ParticipantModel.fromParticipantForUserResponse(x));
            const endpointParticipants = [endpointOne, endpointTwo].map(x => ParticipantModel.fromVideoEndpointResponse(x));
            spyOnProperty(sut, 'participants', 'get').and.returnValue(participants.concat(endpointParticipants));

            // Act
            const result = sut.nonEndpointParticipants;

            // Assert
            expect(result.length).toEqual(participants.length);
            participants.forEach(x => expect(result).toContain(x));
            endpointParticipants.forEach(x => expect(result).not.toContain(x));
        });
    });

    describe('get virtualMeetingRooms', () => {
        it('should return a list of virtual meeting rooms', () => {
            // Arrange
            const nonVmrParticipants = asParticipantModels([participantOne, participantTwo]).concat(
                [endpointOne, endpointTwo].map(x => ParticipantModel.fromVideoEndpointResponse(x))
            );
            const vmrParticipants = asParticipantModels([vmrParticipantOne, vmrParticipantTwo]);
            const expectedVmrs = [new VirtualMeetingRoomModel(vmrId, vmrLabel, vmrLocked, vmrParticipants)];
            spyOnProperty(sut, 'participants', 'get').and.returnValue(nonVmrParticipants.concat(vmrParticipants));

            // Act
            const result = sut.virtualMeetingRooms;

            // Assert
            expect(result.length).toEqual(expectedVmrs.length);
            expectedVmrs.forEach(x => expect(expectedVmrs).toContain(x));
            expectedVmrs.forEach(x => nonVmrParticipants.forEach(y => expect(x.participants).not.toContain(y)));
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
            getParticipantsByConferenceId$.next(participantResponses);
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
            getParticipantsByConferenceId$.next(participantResponses);
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
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual([]);
        }));
    });

    describe('getPexipIdForParticipant', () => {
        it('should return the pexip id for the given participant id', () => {
            // Arrange
            const participantId = 'participant-id';
            const pexipId = 'pexip-id';

            const participantIdToPexipIdMap = {};
            participantIdToPexipIdMap[participantId] = pexipId;

            spyOnProperty(sut, 'participantIdToPexipIdMap', 'get').and.returnValue(participantIdToPexipIdMap);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toEqual(pexipId);
        });

        it('should return the pexip id for the given participant id when participant id is a guid', () => {
            // Arrange
            const participantId = Guid.create();
            const pexipId = 'pexip-id';

            const participantIdToPexipIdMap = {};
            participantIdToPexipIdMap[participantId.toString()] = pexipId;

            spyOnProperty(sut, 'participantIdToPexipIdMap', 'get').and.returnValue(participantIdToPexipIdMap);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toEqual(pexipId);
        });

        it('should an empty guid if the participant does not exist', () => {
            // Arrange

            const participantIdToPexipIdMap = {};

            spyOnProperty(sut, 'participantIdToPexipIdMap', 'get').and.returnValue(participantIdToPexipIdMap);

            // Act
            const result = sut.getPexipIdForParticipant('participant-id');

            // Assert
            expect(result).toBe(Guid.EMPTY);
        });

        it('should an empty guid if the pexip id is null', () => {
            // Arrange
            const participantId = Guid.create();

            const participantIdToPexipIdMap = {};
            participantIdToPexipIdMap[participantId.toString()] = null;

            spyOnProperty(sut, 'participantIdToPexipIdMap', 'get').and.returnValue(participantIdToPexipIdMap);

            // Act
            const result = sut.getPexipIdForParticipant(participantId);

            // Assert
            expect(result).toBe(Guid.EMPTY);
        });
    });

    describe('handlePexipParticipantUpdates', () => {
        describe('maintains pexip id map', () => {
            it('should set the pexip ID when the event is raised', () => {
                // Arrange
                const pexipId = 'pexip-id';
                const participantId = participantOne.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown) as ParticipantUpdated;

                const expectedValue: { [participantId: string]: string } = {};
                expectedValue[participantId] = pexipId;

                spyOnProperty(sut, 'participants', 'get').and.returnValue([participantOne, participantTwo]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);

                // Assert
                expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
            });

            it('should set a second pexip ID when the event is raised again', () => {
                // Arrange
                const pexipIdOne = 'pexip-id-one';
                const pexipIdTwo = 'pexip-id-two';
                const participantOneId = participantOne.id;
                const participantTwoId = participantTwo.id;
                const pexipNameOne = `pexip-name-${participantOneId}`;
                const pexipNameTwo = `pexip-name-${participantTwoId}`;

                const participantUpdatedOne = ({
                    pexipDisplayName: pexipNameOne,
                    uuid: pexipIdOne
                } as unknown) as ParticipantUpdated;

                const participantUpdatedTwo = ({
                    pexipDisplayName: pexipNameTwo,
                    uuid: pexipIdTwo
                } as unknown) as ParticipantUpdated;

                const expectedValue: { [participantId: string]: string } = {};
                expectedValue[participantOneId] = pexipIdOne;
                expectedValue[participantTwoId] = pexipIdTwo;

                spyOnProperty(sut, 'participants', 'get').and.returnValue(asParticipantModels([participantOne, participantTwo]));

                // Act
                sut.handlePexipParticipantUpdate(participantUpdatedOne);
                sut.handlePexipParticipantUpdate(participantUpdatedTwo);

                // Assert
                expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
            });

            it('should update an existing ID when the event is raised again', () => {
                // Arrange
                const pexipIdOne = 'pexip-id-one';
                const pexipIdTwo = 'pexip-id-two';
                const pexipIdThree = 'pexip-id-three';
                const participantOneId = participantOne.id;
                const participantTwoId = participantTwo.id;
                const pexipNameOne = `pexip-name-${participantOneId}`;
                const pexipNameTwo = `pexip-name-${participantTwoId}`;

                const participantUpdatedOne = ({
                    pexipDisplayName: pexipNameOne,
                    uuid: pexipIdOne
                } as unknown) as ParticipantUpdated;

                const participantUpdatedTwo = ({
                    pexipDisplayName: pexipNameTwo,
                    uuid: pexipIdTwo
                } as unknown) as ParticipantUpdated;

                const participantUpdatedThree = ({
                    pexipDisplayName: pexipNameOne,
                    uuid: pexipIdThree
                } as unknown) as ParticipantUpdated;

                const expectedValue: { [participantId: string]: string } = {};
                expectedValue[participantOneId] = pexipIdThree;
                expectedValue[participantTwoId] = pexipIdTwo;

                spyOnProperty(sut, 'participants', 'get').and.returnValue(asParticipantModels([participantOne, participantTwo]));

                // Act
                sut.handlePexipParticipantUpdate(participantUpdatedOne);
                sut.handlePexipParticipantUpdate(participantUpdatedTwo);
                sut.handlePexipParticipantUpdate(participantUpdatedThree);

                // Assert
                expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
            });

            it('should NOT set an ID if the participant cannot be found', () => {
                // Arrange
                const pexipId = 'pexip-id';
                const participantId = Guid.create().toString();
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown) as ParticipantUpdated;

                const expectedValue: { [participantId: string]: string } = {};

                spyOnProperty(sut, 'participants', 'get').and.returnValue(asParticipantModels([participantOne, participantTwo]));

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);

                // Assert
                expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
            });

            it('should update the pexip id map for VMR participants', () => {
                // Arrange
                const pexipId = 'pexip-id';
                const pexipName = `pexip-name-${vmrId}`;
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId
                } as unknown) as ParticipantUpdated;

                const expectedValue: { [participantId: string]: string } = {};
                expectedValue[vmrParticipantOneId] = pexipId;
                expectedValue[vmrParticipantTwoId] = pexipId;

                spyOnProperty(sut, 'participants', 'get').and.returnValue(
                    asParticipantModels([participantOne, participantTwo, vmrParticipantOne, vmrParticipantTwo])
                );

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);

                // Assert
                expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
            });
        });

        describe('handles spotlight status changes', () => {
            it('should emit an onParticipantSpotlightStatusChanged event when a participants spotlight status changes', fakeAsync(() => {
                // Arrange
                const pexipId = 'pexip-id';
                const participant = ParticipantModel.fromParticipantForUserResponse(participantOne);
                const participantId = participant.id;
                const pexipName = `pexip-name-${participantId}`;
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isSpotlighted: true
                } as unknown) as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantSpotlightStatusChanged$.subscribe(participant => {
                    result = participant;
                });

                participant.isSpotlighted = false;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);
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
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isSpotlighted: true
                } as unknown) as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantSpotlightStatusChanged$.subscribe(participant => {
                    result = participant;
                });

                participant.isSpotlighted = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);
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
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isRemoteMuted: true
                } as unknown) as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantRemoteMuteStatusChanged$.subscribe(participant => {
                    result = participant;
                });

                participant.isRemoteMuted = false;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);
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
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    isRemoteMuted: true
                } as unknown) as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantRemoteMuteStatusChanged$.subscribe(participant => {
                    result = participant;
                });

                participant.isRemoteMuted = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);
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
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    handRaised: true
                } as unknown) as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantRemoteMuteStatusChanged$.subscribe(participant => {
                    result = participant;
                });

                participant.isHandRaised = false;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);
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
                const participantUpdated = ({
                    pexipDisplayName: pexipName,
                    uuid: pexipId,
                    handRaised: true
                } as unknown) as ParticipantUpdated;

                let result: ParticipantModel = null;
                const subscriber = sut.onParticipantHandRaisedStatusChanged$.subscribe(participant => {
                    result = participant;
                });

                participant.isHandRaised = true;
                spyOnProperty(sut, 'participants', 'get').and.returnValue([participant]);

                // Act
                sut.handlePexipParticipantUpdate(participantUpdated);
                flush();
                subscriber.unsubscribe();

                // Assert
                expect(result).toBeNull();
                expect(participant.isHandRaised).toBeTrue();
            }));
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
            sut.onParticipantStatusChanged$.subscribe(participant => (result = participant));
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
            sut.onParticipantStatusChanged$.subscribe(participant => (result = participant));
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
            sut.onParticipantStatusChanged$.subscribe(participant => (result = participant));
            sut.handleParticipantStatusUpdate(participantStatusMessage);
            flush();

            // Assert
            expect(result).toBeNull();
        }));
    });
});
