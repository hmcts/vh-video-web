import { fakeAsync, flush, tick } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { Participant } from 'src/app/shared/models/participant';
import { HearingRole } from 'src/app/waiting-space/models/hearing-role-model';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ConferenceResponse, ParticipantForUserResponse, ParticipantStatus, Role } from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import { ConferenceService } from './conference.service';
import { ParticipantService } from './participant.service';
import { IHearingControlsState, VideoControlCacheService } from './video-control-cache.service';
import { VideoControlService } from './video-control.service';

fdescribe('VideoControlService', () => {
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;

    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let sut: VideoControlService;

    beforeEach(() => {
        participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', ['getPexipIdForParticipant']);

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['spotlightParticipant', 'onParticipantUpdated']);

        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', [
            'setSpotlightStatus',
            'getSpotlightStatus',
            'getStateForConference'
        ]);

        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'info']);

        sut = new VideoControlService(participantServiceSpy, videoCallServiceSpy, videoControlCacheServiceSpy, loggerSpy);
    });

    it('should be created', () => {
        expect(sut).toBeTruthy();
    });

    describe('setSpotlightStatus', () => {
        it('should spotlight the participant and update the value in the cache when the response is recieved', fakeAsync(() => {
            // Arrange
            const participantId = 'participant-id';
            const pexipParticipantId = 'pexip-participant-id';
            const conferenceId = 'conference-id';
            const pexipId = 'pexip-id';

            participantServiceSpy.getPexipIdForParticipant.and.returnValue(pexipParticipantId);

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
            const participantId = 'participant-id';
            const pexipParticipantId = 'pexip-participant-id';
            const conferenceId = 'conference-id';
            const pexipId = 'pexip-id';

            participantServiceSpy.getPexipIdForParticipant.and.returnValue(pexipParticipantId);

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
            const participantId = 'participant-id';
            const pexipParticipantId = 'pexip-participant-id';
            const conferenceId = 'conference-id';
            const pexipId = 'pexip-id';

            participantServiceSpy.getPexipIdForParticipant.and.returnValue(pexipParticipantId);

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
