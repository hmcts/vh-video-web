import { fakeAsync, flush, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Observable, Subject } from 'rxjs';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ApiClient, ParticipantForUserResponse, ParticipantStatus, Role } from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import { ParticipantService } from './participant.service';

fdescribe('ParticipantService', () => {
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
        linked_participants: []
    });

    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    let getParticipantsByConferenceId$: Subject<ParticipantForUserResponse[]>;

    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let participantUpdatedSubject: Subject<ParticipantUpdated>;
    let participantUpdated$: Observable<ParticipantUpdated>;

    let loggerSpy: jasmine.SpyObj<Logger>;

    let sut: ParticipantService;

    beforeEach(() => {
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['getParticipantsByConferenceId']);

        getParticipantsByConferenceId$ = new Subject<ParticipantForUserResponse[]>();
        apiClientSpy.getParticipantsByConferenceId.and.returnValue(getParticipantsByConferenceId$.asObservable());

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['onParticipantUpdated']);

        participantUpdatedSubject = new Subject<ParticipantUpdated>();
        participantUpdated$ = participantUpdatedSubject.asObservable();
        spyOn(participantUpdated$, 'subscribe').and.callThrough();
        videoCallServiceSpy.onParticipantUpdated.and.returnValue(participantUpdated$);

        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'warn']);

        sut = new ParticipantService(apiClientSpy, videoCallServiceSpy, loggerSpy);

        apiClientSpy.getParticipantsByConferenceId.calls.reset();
    });

    describe('construction', () => {
        it('should be created and the initialise participant list', fakeAsync(() => {
            // Act
            const participantResponses = [participantOne, participantTwo];
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(sut).toBeTruthy();
            expect(sut.participants).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
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
    });

    describe('getParticipantsForConference', () => {
        it('should return the participants from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses = [participantOne, participantTwo];

            let result: Participant[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId);
            expect(result).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
        }));

        it('should return the participants from VideoWebService when called with a GUID', fakeAsync(() => {
            // Arrange
            const participantResponses = [participantOne, participantTwo];
            const conferenceId = Guid.create();

            let result: Participant[];

            // Act
            sut.getParticipantsForConference(conferenceId).subscribe(participants => (result = participants));
            getParticipantsByConferenceId$.next(participantResponses);
            flush();

            // Assert
            expect(apiClientSpy.getParticipantsByConferenceId).toHaveBeenCalledOnceWith(conferenceId.toString());
            expect(result).toEqual(participantResponses.map(participantResponse => new Participant(participantResponse)));
        }));

        it('should return an empty array if no particiapnts are returned from VideoWebService', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantResponses: ParticipantForUserResponse[] = [];

            let result: Participant[];

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

    describe('handle VideoCallService.onParticipantUpdated', () => {
        it('should set the pexip ID when the event is raised', fakeAsync(() => {
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
            participantUpdatedSubject.next(participantUpdated);
            flush();

            // Assert
            expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
        }));

        it('should set a second pexip ID when the event is raised again', fakeAsync(() => {
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

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participantOne, participantTwo]);

            // Act
            participantUpdatedSubject.next(participantUpdatedOne);
            flush();
            participantUpdatedSubject.next(participantUpdatedTwo);
            flush();

            // Assert
            expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
        }));

        it('should update an existing ID when the event is raised again', fakeAsync(() => {
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

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participantOne, participantTwo]);

            // Act
            participantUpdatedSubject.next(participantUpdatedOne);
            flush();
            participantUpdatedSubject.next(participantUpdatedTwo);
            flush();
            participantUpdatedSubject.next(participantUpdatedThree);
            flush();

            // Assert
            expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
        }));

        it('should NOT set an ID if the participant cannot be found', fakeAsync(() => {
            // Arrange
            const pexipId = 'pexip-id';
            const participantId = Guid.create().toString();
            const pexipName = `pexip-name-${participantId}`;
            const participantUpdated = ({
                pexipDisplayName: pexipName,
                uuid: pexipId
            } as unknown) as ParticipantUpdated;

            const expectedValue: { [participantId: string]: string } = {};

            spyOnProperty(sut, 'participants', 'get').and.returnValue([participantOne, participantTwo]);

            // Act
            participantUpdatedSubject.next(participantUpdated);
            flush();

            // Assert
            expect(sut.participantIdToPexipIdMap).toEqual(expectedValue);
        }));
    });
});
