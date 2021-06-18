import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { of, Subject } from 'rxjs';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { CaseTypeGroup } from 'src/app/waiting-space/models/case-type-group';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ParticipantStatus, Role } from '../clients/api-client';
import { LoggerService } from '../logging/logger.service';
import { VirtualMeetingRoomModel } from './models/virtual-meeting-room.model';
import { ParticipantService } from './participant.service';
import { IHearingControlsState, VideoControlCacheService } from './video-control-cache.service';
import { VideoControlService } from './video-control.service';

fdescribe('VideoControlService', () => {
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;

    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    let sut: VideoControlService;

    beforeEach(() => {
        participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', ['getParticipantOrVirtualMeetingRoomById']);

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['spotlightParticipant', 'onParticipantUpdated']);

        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', [
            'setSpotlightStatus',
            'getSpotlightStatus',
            'getStateForConference'
        ]);

        loggerSpy = jasmine.createSpyObj<LoggerService>('Logger', ['error', 'info']);

        sut = new VideoControlService(participantServiceSpy, videoCallServiceSpy, videoControlCacheServiceSpy, loggerSpy);
    });

    it('should be created', () => {
        expect(sut).toBeTruthy();
    });

    describe('setSpotlightStatus', () => {
        const pexipId = 'pexip-id';
        const participant = new ParticipantModel(
            Guid.create().toString(),
            'Participant Name',
            ' Display Name',
            'Role;DisplayName;ID',
            CaseTypeGroup.JUDGE,
            Role.Judge,
            HearingRole.JUDGE,
            false,
            null,
            null,
            ParticipantStatus.Available,
            null,
            pexipId
        );
        const vmr = new VirtualMeetingRoomModel(Guid.create().toString(), 'Display Name', false, [participant]);
        it('should spotlight the participant and update the value in the cache when the response is recieved', fakeAsync(() => {
            // Arrange
            const participantId = participant.id;
            const pexipParticipantId = participant.pexipId;
            const conferenceId = 'conference-id';

            participantServiceSpy.getParticipantOrVirtualMeetingRoomById.and.returnValue(participant);

            const pexipName = `pexip-name-${participantId}`;
            const participantUpdated = ({
                pexipDisplayName: pexipName,
                uuid: pexipId,
                isSpotlighted: true
            } as unknown) as ParticipantUpdated;

            videoCallServiceSpy.onParticipantUpdated.and.returnValue(of(participantUpdated));

            let result = null;
            // Act
            sut.setSpotlightStatus(conferenceId, participantId, true).subscribe(updatedParticipant => (result = updatedParticipant));
            flush();

            // Assert
            expect(result).toBe(participantUpdated);
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                pexipParticipantId,
                true,
                conferenceId,
                participantId
            );
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId, true);
        }));

        it('should spotlight the participant and update the value in the cache when the response is recieved when it is a VMR', fakeAsync(() => {
            // Arrange
            const participantId = vmr.id;
            const pexipParticipantId = vmr.pexipId;
            const conferenceId = 'conference-id';

            participantServiceSpy.getParticipantOrVirtualMeetingRoomById.and.returnValue(vmr);

            const pexipName = `pexip-name-${participantId}`;
            const participantUpdated = ({
                pexipDisplayName: pexipName,
                uuid: pexipId,
                isSpotlighted: true
            } as unknown) as ParticipantUpdated;

            videoCallServiceSpy.onParticipantUpdated.and.returnValue(of(participantUpdated));

            let result = null;
            // Act
            sut.setSpotlightStatus(conferenceId, participantId, true).subscribe(updatedParticipant => (result = updatedParticipant));
            flush();

            // Assert
            expect(result).toBe(participantUpdated);
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                pexipParticipantId,
                true,
                conferenceId,
                participantId
            );
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId, true);
        }));

        it('should throw when the response times out', fakeAsync(() => {
            // Arrange
            const participantId = participant.id;
            const pexipParticipantId = participant.pexipId;
            const conferenceId = 'conference-id';

            participantServiceSpy.getParticipantOrVirtualMeetingRoomById.and.returnValue(participant);

            const pexipName = `pexip-name-${participantId}`;
            const participantUpdated = ({
                pexipDisplayName: pexipName,
                uuid: pexipId,
                isSpotlighted: true
            } as unknown) as ParticipantUpdated;

            const onParticipantUpdatedSubject = new Subject<ParticipantUpdated>();
            videoCallServiceSpy.onParticipantUpdated.and.returnValue(onParticipantUpdatedSubject.asObservable());

            let result = null;
            const timeoutInMS = 15;
            // Act
            sut.setSpotlightStatus(conferenceId, participantId, true, timeoutInMS).subscribe(
                updatedParticipant => (result = updatedParticipant),
                err => (result = err)
            );
            tick(timeoutInMS * 1000 + 1000);
            onParticipantUpdatedSubject.next(participantUpdated);
            flush();

            // Assert
            expect(result).not.toBeNull();
            expect(result).toBeInstanceOf(Error);
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                pexipParticipantId,
                true,
                conferenceId,
                participantId
            );
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId, true);
        }));

        it('should not time out when zero is passed in as responseTimeoutInMS', fakeAsync(() => {
            // Arrange
            const participantId = participant.id;
            const pexipParticipantId = participant.pexipId;
            const conferenceId = 'conference-id';

            participantServiceSpy.getParticipantOrVirtualMeetingRoomById.and.returnValue(participant);

            const pexipName = `pexip-name-${participantId}`;
            const participantUpdated = ({
                pexipDisplayName: pexipName,
                uuid: pexipId,
                isSpotlighted: true
            } as unknown) as ParticipantUpdated;

            videoCallServiceSpy.onParticipantUpdated.and.returnValue(of(participantUpdated));

            let result = null;
            // Act
            sut.setSpotlightStatus(conferenceId, participantId, true, 0).subscribe(updatedParticipant => (result = updatedParticipant));
            tick(30 * 1000);
            flush();

            // Assert
            expect(result).toBe(participantUpdated);
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                pexipParticipantId,
                true,
                conferenceId,
                participantId
            );
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId, true);
        }));
    });

    describe('isParticipantSpotlighted', () => {
        it('should return true if the user is spotlighted', () => {
            // Arrange
            const participantId = 'participant-id';
            const conferenceId = 'conference-id';

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(true);

            // Act
            const result = sut.isParticipantSpotlighted(conferenceId, participantId);

            // Assert
            expect(result).toBeTrue();
            expect(videoControlCacheServiceSpy.getSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId);
        });

        it('should return false if the user is NOT spotlighted', () => {
            // Arrange
            const participantId = 'participant-id';
            const conferenceId = 'conference-id';

            videoControlCacheServiceSpy.getSpotlightStatus.and.returnValue(false);

            // Act
            const result = sut.isParticipantSpotlighted(conferenceId, participantId);

            // Assert
            expect(result).toBeFalse();
            expect(videoControlCacheServiceSpy.getSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId);
        });
    });

    describe('getSpotlightedParticipants', () => {
        it('should return spotlighted participants', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantIdOne = 'participant-id-1';
            const participantIdTwo = 'participant-id-2';
            const participantIdThree = 'participant-id-3';
            const expectedResult = [participantIdOne, participantIdTwo];

            const stateForConference: IHearingControlsState = {
                participantStates: {}
            };
            stateForConference.participantStates[participantIdOne] = { isSpotlighted: true };
            stateForConference.participantStates[participantIdTwo] = { isSpotlighted: true };
            stateForConference.participantStates[participantIdThree] = { isSpotlighted: false };

            videoControlCacheServiceSpy.getStateForConference.and.returnValue(stateForConference);

            // Act
            const result = sut.getSpotlightedParticipants(conferenceId);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(videoControlCacheServiceSpy.getStateForConference).toHaveBeenCalledOnceWith(conferenceId);
        });

        it('should return an empty array if no participants are spotlighted', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantIdOne = 'participant-id-1';
            const participantIdTwo = 'participant-id-2';
            const participantIdThree = 'participant-id-3';

            const stateForConference: IHearingControlsState = {
                participantStates: {}
            };
            stateForConference.participantStates[participantIdOne] = { isSpotlighted: false };
            stateForConference.participantStates[participantIdTwo] = { isSpotlighted: false };
            stateForConference.participantStates[participantIdThree] = { isSpotlighted: false };

            videoControlCacheServiceSpy.getStateForConference.and.returnValue(stateForConference);

            // Act
            const result = sut.getSpotlightedParticipants(conferenceId);

            // Assert
            expect(result).toEqual([]);
            expect(videoControlCacheServiceSpy.getStateForConference).toHaveBeenCalledOnceWith(conferenceId);
        });

        it('should return an empty array if there are no participants', () => {
            // Arrange
            const conferenceId = 'conference-id';

            const stateForConference: IHearingControlsState = {
                participantStates: {}
            };

            videoControlCacheServiceSpy.getStateForConference.and.returnValue(stateForConference);

            // Act
            const result = sut.getSpotlightedParticipants(conferenceId);

            // Assert
            expect(result).toEqual([]);
            expect(videoControlCacheServiceSpy.getStateForConference).toHaveBeenCalledOnceWith(conferenceId);
        });
    });
});
