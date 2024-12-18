import { fakeAsync, flush, flushMicrotasks, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Observable, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ParticipantForUserResponse, ParticipantStatus, Role } from '../clients/api-client';
import { LoggerService } from '../logging/logger.service';
import { ConferenceService } from './conference.service';
import { PexipDisplayNameModel } from './models/pexip-display-name.model';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';
import { VideoControlCacheService } from './video-control-cache.service';
import { VideoControlService } from './video-control.service';

describe('VideoControlService', () => {
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;

    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    let sut: VideoControlService;

    const conferenceId = 'conference-id-1';
    const participantOneId = Guid.create().toString();
    const participantOnePeixpId = Guid.create().toString();
    const participantOne = ParticipantModel.fromParticipantForUserResponse(
        new ParticipantForUserResponse({
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
        })
    );

    beforeEach(() => {
        participantOne.pexipId = participantOnePeixpId;

        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>('ConferenceService', ['getConferenceById'], ['currentConferenceId']);
        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', [
            'spotlightParticipant',
            'onParticipantUpdated',
            'muteParticipant',
            'lowerHand',
            'raiseHand'
        ]);

        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', [
            'setSpotlightStatus',
            'getSpotlightStatus',
            'setLocalVideoMuted',
            'getLocalVideoMuted',
            'setLocalAudioMuted',
            'getLocalAudioMuted',
            'setRemoteMutedStatus',
            'getRemoteMutedStatus',
            'setHandRaiseStatus',
            'getHandRaiseStatus'
        ]);

        loggerSpy = jasmine.createSpyObj<LoggerService>('Logger', ['error', 'warn', 'info', 'debug']);

        sut = new VideoControlService(conferenceServiceSpy, videoCallServiceSpy, videoControlCacheServiceSpy, loggerSpy);
    });

    describe('setSpotlightStatus', () => {
        // Arrange test cases
        const participantId = Guid.create().toString();
        const participantPexipId = 'pexip-id';
        const vmrId = Guid.create().toString();
        const vmrPexipId = 'vmr-pexip-id';
        const participant = new ParticipantModel(
            participantId,
            'Participant Name',
            'DisplayName',
            `Role;DisplayName;${participantId}`,
            Role.Judge,
            HearingRole.JUDGE,
            false,
            null,
            null,
            ParticipantStatus.Available,
            null,
            participantPexipId
        );
        const vmr = new VirtualMeetingRoomModel(
            vmrId,
            'DisplayName',
            false,
            [participant],
            vmrPexipId,
            new PexipDisplayNameModel('ROLE', 'DisplayName', vmrId)
        );
        const testCases = [
            { testId: 'a participant and spotlight = true', participantOrVmr: participant, isSpotlighted: true },
            { testId: 'a participant and spotlight = false', participantOrVmr: participant, isSpotlighted: false },
            { testId: 'a virtual meeting room and spotlight = true', participantOrVmr: vmr, isSpotlighted: true },
            { testId: 'a virtual meeting roomt and spotlight = false', participantOrVmr: vmr, isSpotlighted: false }
        ];

        let onParticipantUpdatedSubject: Subject<ParticipantUpdated>;
        let onParticipantUpdated$: Observable<ParticipantUpdated>;

        beforeEach(() => {
            // Arrange spies
            onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
            onParticipantUpdated$ = onParticipantUpdatedSubject.asObservable();
            videoCallServiceSpy.onParticipantUpdated.and.returnValue(onParticipantUpdated$);
        });

        testCases.forEach(testCase => {
            it(`should try to set the participants spotlight status using the video call service; for ${testCase.testId}`, fakeAsync(() => {
                // Act
                sut.setSpotlightStatus(testCase.participantOrVmr, testCase.isSpotlighted);
                flush();

                // Assert
                expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                    testCase.participantOrVmr.pexipId,
                    testCase.isSpotlighted,
                    conferenceId,
                    testCase.participantOrVmr.id
                );
            }));

            it(`should subscribe to pexip participant updates; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                spyOn(onParticipantUpdated$, 'subscribe').and.callThrough();
                spyOn(onParticipantUpdated$, 'pipe').and.returnValue(onParticipantUpdated$);

                // Act
                sut.setSpotlightStatus(testCase.participantOrVmr, testCase.isSpotlighted);
                flush();

                // Assert
                expect(videoCallServiceSpy.onParticipantUpdated).toHaveBeenCalled();
                expect(onParticipantUpdated$.subscribe).toHaveBeenCalled();
            }));

            it(`should update the cache value when the correct update is recieved; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                const expectedResult = {
                    isRemoteMuted: false,
                    isSpotlighted: testCase.isSpotlighted,
                    handRaised: false,
                    pexipDisplayName: testCase.participantOrVmr.pexipDisplayName.toString(),
                    uuid: testCase.participantOrVmr.pexipId,
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'protocol'
                } as ParticipantUpdated;

                // Act
                sut.setSpotlightStatus(testCase.participantOrVmr, testCase.isSpotlighted);
                flush();

                onParticipantUpdatedSubject.next(expectedResult);
                flush();
                flushMicrotasks();

                // Assert
                expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledWith(
                    testCase.participantOrVmr.id,
                    testCase.isSpotlighted
                );
            }));

            it(`should NOT update the cache value when the correct update is NOT recieved; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                const expectedResult = {
                    isRemoteMuted: false,
                    isSpotlighted: testCase.isSpotlighted,
                    handRaised: false,
                    pexipDisplayName: 'pexipDisplayName',
                    uuid: testCase.participantOrVmr.pexipId,
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'protocol'
                } as ParticipantUpdated;

                // Act
                sut.setSpotlightStatus(testCase.participantOrVmr, testCase.isSpotlighted);
                flush();

                onParticipantUpdatedSubject.next(expectedResult);
                flush();

                // Assert
                expect(videoControlCacheServiceSpy.setSpotlightStatus).not.toHaveBeenCalled();
            }));

            it(`should keep trying to set the participants spotlight status using the video call service until the update contains the correct value; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                const expectedResult = {
                    isRemoteMuted: false,
                    isSpotlighted: !testCase.isSpotlighted,
                    handRaised: false,
                    pexipDisplayName: testCase.participantOrVmr.pexipDisplayName.toString(),
                    uuid: testCase.participantOrVmr.pexipId,
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'protocol'
                } as ParticipantUpdated;

                // Act
                sut.setSpotlightStatus(testCase.participantOrVmr, testCase.isSpotlighted);
                flush();

                onParticipantUpdatedSubject.next(expectedResult);
                flush();
                tick(201);
                flush();

                // Assert
                expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledTimes(2);
                expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledWith(
                    testCase.participantOrVmr.pexipId,
                    testCase.isSpotlighted,
                    conferenceId,
                    testCase.participantOrVmr.id
                );
            }));
        });
    });

    describe('isParticipantSpotlighted', () => {
        it('should return true if the user is spotlighted', () => {
            // Arrange
            const participantId = 'participant-id';

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(true);

            // Act
            const result = sut.isParticipantSpotlighted(participantId);

            // Assert
            expect(result).toBeTrue();
            expect(videoControlCacheServiceSpy.getSpotlightStatus).toHaveBeenCalledOnceWith(participantId);
        });

        it('should return false if the user is NOT spotlighted', () => {
            // Arrange
            const participantId = 'participant-id';

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(false);

            // Act
            const result = sut.isParticipantSpotlighted(participantId);

            // Assert
            expect(result).toBeFalse();
            expect(videoControlCacheServiceSpy.getSpotlightStatus).toHaveBeenCalledOnceWith(participantId);
        });
    });

    describe('restoreParticipantState', () => {
        let onParticipantUpdatedSubject: Subject<ParticipantUpdated>;
        let onParticipantUpdated$: Observable<ParticipantUpdated>;

        beforeEach(() => {
            // Arrange spies
            onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
            onParticipantUpdated$ = onParticipantUpdatedSubject.asObservable();
            videoCallServiceSpy.onParticipantUpdated.and.returnValue(onParticipantUpdated$);
        });

        it('should restore spotlight state for a participant if the state is true', () => {
            // Arrange
            const spotlightState = true;

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(spotlightState);

            participantOne.id = participantOneId;
            participantOne.pexipId = participantOnePeixpId;

            // Act
            sut.restoreParticipantsSpotlight(participantOne);

            // Assert
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                participantOnePeixpId,
                spotlightState,
                conferenceId,
                participantOneId
            );
        });

        it('should NOT restore spotlight state for a participant if the state is false', () => {
            // Arrange
            const spotlightState = false;

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(spotlightState);

            participantOne.id = participantOneId;
            participantOne.pexipId = participantOnePeixpId;

            // Act
            sut.restoreParticipantsSpotlight(participantOne);

            // Assert
            expect(videoCallServiceSpy.spotlightParticipant).not.toHaveBeenCalled();
        });
    });

    describe('setLocalAudioMuteById', () => {
        it('should call setLocalAudioMuted in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localAudioMuted = false;

            // Act
            sut.setLocalAudioMutedById(participantId, localAudioMuted);

            // Assert
            expect(videoControlCacheServiceSpy.setLocalAudioMuted).toHaveBeenCalledOnceWith(participantId, localAudioMuted);
        });

        it('should call setLocalAudioMuted in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localAudioMuted = true;

            // Act
            sut.setLocalAudioMutedById(participantId, localAudioMuted);

            // Assert
            expect(videoControlCacheServiceSpy.setLocalAudioMuted).toHaveBeenCalledOnceWith(participantId, localAudioMuted);
        });
    });

    describe('getLocalAudioMutedById', () => {
        it('should call and return the value from getLocalAudioMuted in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localAudioMuted = false;
            videoControlCacheServiceSpy.getLocalAudioMuted.and.returnValue(localAudioMuted);

            // Act
            const result = sut.getLocalAudioMutedById(participantId);

            // Assert
            expect(result).toEqual(localAudioMuted);
            expect(videoControlCacheServiceSpy.getLocalAudioMuted).toHaveBeenCalledOnceWith(participantId);
        });

        it('should call and return the value from getLocalAudioMuted in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localAudioMuted = true;
            videoControlCacheServiceSpy.getLocalAudioMuted.and.returnValue(localAudioMuted);

            // Act
            const result = sut.getLocalAudioMutedById(participantId);

            // Assert
            expect(result).toEqual(localAudioMuted);
            expect(videoControlCacheServiceSpy.getLocalAudioMuted).toHaveBeenCalledOnceWith(participantId);
        });
    });

    describe('setLocalVideoMuteById', () => {
        it('should call setLocalAudioMuted in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localVideoMuted = false;

            // Act
            sut.setLocalVideoMutedById(participantId, localVideoMuted);

            // Assert
            expect(videoControlCacheServiceSpy.setLocalVideoMuted).toHaveBeenCalledOnceWith(participantId, localVideoMuted);
        });

        it('should call setLocalAudioMuted in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localVideoMuted = true;

            // Act
            sut.setLocalVideoMutedById(participantId, localVideoMuted);

            // Assert
            expect(videoControlCacheServiceSpy.setLocalVideoMuted).toHaveBeenCalledOnceWith(participantId, localVideoMuted);
        });
    });

    describe('getLocalVideoMutedById', () => {
        it('should call and return the value from getLocalAudioMuted in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localVideoMuted = false;
            videoControlCacheServiceSpy.getLocalVideoMuted.and.returnValue(localVideoMuted);

            // Act
            const result = sut.getLocalVideoMutedById(participantId);

            // Assert
            expect(result).toEqual(localVideoMuted);
            expect(videoControlCacheServiceSpy.getLocalVideoMuted).toHaveBeenCalledOnceWith(participantId);
        });

        it('should call and return the value from getLocalAudioMuted in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const localVideoMuted = true;
            videoControlCacheServiceSpy.getLocalVideoMuted.and.returnValue(localVideoMuted);

            // Act
            const result = sut.getLocalVideoMutedById(participantId);

            // Assert
            expect(result).toEqual(localVideoMuted);
            expect(videoControlCacheServiceSpy.getLocalVideoMuted).toHaveBeenCalledOnceWith(participantId);
        });
    });

    describe('setRemoteMuteStatusById', () => {
        // Arrange test cases
        const participantId = Guid.create().toString();
        const participantPexipId = 'pexip-id';
        const vmrId = Guid.create().toString();
        const vmrPexipId = 'vmr-pexip-id';
        const participant = new ParticipantModel(
            participantId,
            'Participant Name',
            'DisplayName',
            `Role;DisplayName;${participantId}`,
            Role.Judge,
            HearingRole.JUDGE,
            false,
            null,
            null,
            ParticipantStatus.Available,
            null,
            participantPexipId
        );
        const vmr = new VirtualMeetingRoomModel(
            vmrId,
            'DisplayName',
            false,
            [participant],
            vmrPexipId,
            new PexipDisplayNameModel('ROLE', 'DisplayName', vmrId)
        );
        const testCases = [
            { testId: 'a participant and isRemoteMuted = true', participantOrVmr: participant, isRemoteMuted: true },
            { testId: 'a participant and isRemoteMuted = false', participantOrVmr: participant, isRemoteMuted: false },
            { testId: 'a virtual meeting room and isRemoteMuted = true', participantOrVmr: vmr, isRemoteMuted: true },
            { testId: 'a virtual meeting room and isRemoteMuted = false', participantOrVmr: vmr, isRemoteMuted: false }
        ];

        let onParticipantUpdatedSubject: Subject<ParticipantUpdated>;
        let onParticipantUpdated$: Observable<ParticipantUpdated>;

        beforeEach(() => {
            // Arrange spies
            onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
            onParticipantUpdated$ = onParticipantUpdatedSubject.asObservable();
            videoCallServiceSpy.onParticipantUpdated.and.returnValue(onParticipantUpdated$);
        });

        testCases.forEach(testCase => {
            it(`should try to set the participants spotlight status using the video call service; for ${testCase.testId}`, fakeAsync(() => {
                // Act
                sut.setRemoteMuteStatus(testCase.participantOrVmr, testCase.isRemoteMuted);
                flush();

                // Assert
                expect(videoCallServiceSpy.muteParticipant).toHaveBeenCalledOnceWith(
                    testCase.participantOrVmr.pexipId,
                    testCase.isRemoteMuted,
                    conferenceId,
                    testCase.participantOrVmr.id
                );
            }));

            it(`should subscribe to pexip participant updates; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                spyOn(onParticipantUpdated$, 'subscribe').and.callThrough();
                spyOn(onParticipantUpdated$, 'pipe').and.returnValue(onParticipantUpdated$);

                // Act
                sut.setRemoteMuteStatus(testCase.participantOrVmr, testCase.isRemoteMuted);
                flush();

                // Assert
                expect(videoCallServiceSpy.onParticipantUpdated).toHaveBeenCalled();
                expect(onParticipantUpdated$.subscribe).toHaveBeenCalled();
            }));

            it(`should update the cache value when the correct update is recieved; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                const expectedResult = {
                    isRemoteMuted: testCase.isRemoteMuted,
                    isSpotlighted: false,
                    handRaised: false,
                    pexipDisplayName: testCase.participantOrVmr.pexipDisplayName.toString(),
                    uuid: testCase.participantOrVmr.pexipId,
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'protocol'
                } as ParticipantUpdated;

                // Act
                sut.setRemoteMuteStatus(testCase.participantOrVmr, testCase.isRemoteMuted);
                flush();

                onParticipantUpdatedSubject.next(expectedResult);
                flush();
                flushMicrotasks();

                // Assert
                expect(videoControlCacheServiceSpy.setRemoteMutedStatus).toHaveBeenCalledWith(
                    testCase.participantOrVmr.id,
                    testCase.isRemoteMuted
                );
            }));

            it(`should NOT update the cache value when the correct update is NOT recieved; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                const expectedResult = {
                    isSpotlighted: false,
                    isRemoteMuted: testCase.isRemoteMuted,
                    handRaised: false,
                    pexipDisplayName: 'pexipDisplayName',
                    uuid: testCase.participantOrVmr.pexipId,
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'protocol'
                } as ParticipantUpdated;

                // Act
                sut.setRemoteMuteStatus(testCase.participantOrVmr, testCase.isRemoteMuted);
                flush();

                onParticipantUpdatedSubject.next(expectedResult);
                flush();

                // Assert
                expect(videoControlCacheServiceSpy.setRemoteMutedStatus).not.toHaveBeenCalled();
            }));

            it(`should keep trying to set the participants spotlight status using the video call service until the update contains the correct value; for ${testCase.testId}`, fakeAsync(() => {
                // Arrange
                const expectedResult = {
                    isSpotlighted: false,
                    isRemoteMuted: !testCase.isRemoteMuted,
                    handRaised: false,
                    pexipDisplayName: testCase.participantOrVmr.pexipDisplayName.toString(),
                    uuid: testCase.participantOrVmr.pexipId,
                    isAudioOnlyCall: false,
                    isVideoCall: true,
                    protocol: 'protocol'
                } as ParticipantUpdated;

                // Act
                sut.setRemoteMuteStatus(testCase.participantOrVmr, testCase.isRemoteMuted);
                flush();

                onParticipantUpdatedSubject.next(expectedResult);
                flush();
                tick(201);
                flush();

                // Assert
                expect(videoCallServiceSpy.muteParticipant).toHaveBeenCalledTimes(2);
                expect(videoCallServiceSpy.muteParticipant).toHaveBeenCalledWith(
                    testCase.participantOrVmr.pexipId,
                    testCase.isRemoteMuted,
                    conferenceId,
                    testCase.participantOrVmr.id
                );
            }));
        });
    });

    describe('getRemoteMuteStatusById', () => {
        it('should call and return the value from getRemoteMuteStatus in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const remoteMuteStatus = false;
            videoControlCacheServiceSpy.getRemoteMutedStatus.and.returnValue(remoteMuteStatus);

            // Act
            const result = sut.getRemoteMutedById(participantId);

            // Assert
            expect(result).toEqual(remoteMuteStatus);
            expect(videoControlCacheServiceSpy.getRemoteMutedStatus).toHaveBeenCalledOnceWith(participantId);
        });

        it('should call and return the value from getRemoteMuteStatus in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const remoteMuteStatus = true;
            videoControlCacheServiceSpy.getRemoteMutedStatus.and.returnValue(remoteMuteStatus);

            // Act
            const result = sut.getRemoteMutedById(participantId);

            // Assert
            expect(result).toEqual(remoteMuteStatus);
            expect(videoControlCacheServiceSpy.getRemoteMutedStatus).toHaveBeenCalledOnceWith(participantId);
        });
    });

    describe('setHandRaiseById', () => {
        it('should call setHandRaised in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const handRaiseStatus = false;

            // Act
            sut.setHandRaiseStatusById(participantId, handRaiseStatus);

            // Assert
            expect(videoCallServiceSpy.raiseHand).not.toHaveBeenCalled();
            expect(videoCallServiceSpy.lowerHand).toHaveBeenCalled();
            expect(videoControlCacheServiceSpy.setHandRaiseStatus).toHaveBeenCalledOnceWith(participantId, handRaiseStatus);
        });

        it('should call setHandRaised in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const handRaiseStatus = true;

            // Act
            sut.setHandRaiseStatusById(participantId, handRaiseStatus);

            // Assert
            expect(videoCallServiceSpy.raiseHand).toHaveBeenCalled();
            expect(videoCallServiceSpy.lowerHand).not.toHaveBeenCalled();
            expect(videoControlCacheServiceSpy.setHandRaiseStatus).toHaveBeenCalledOnceWith(participantId, handRaiseStatus);
        });
    });

    describe('getHandRaiseById', () => {
        it('should call and return the value from getHandRaise in the cache service (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const handRaiseStatus = false;
            videoControlCacheServiceSpy.getHandRaiseStatus.and.returnValue(handRaiseStatus);

            // Act
            const result = sut.getHandRaiseById(participantId);

            // Assert
            expect(result).toEqual(handRaiseStatus);
            expect(videoControlCacheServiceSpy.getHandRaiseStatus).toHaveBeenCalledOnceWith(participantId);
        });

        it('should call and return the value from getHandRaise in the cache service (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const handRaiseStatus = true;
            videoControlCacheServiceSpy.getHandRaiseStatus.and.returnValue(handRaiseStatus);

            // Act
            const result = sut.getHandRaiseById(participantId);

            // Assert
            expect(result).toEqual(handRaiseStatus);
            expect(videoControlCacheServiceSpy.getHandRaiseStatus).toHaveBeenCalledOnceWith(participantId);
        });
    });
});
