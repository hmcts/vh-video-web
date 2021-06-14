import { fakeAsync, flush } from '@angular/core/testing';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ConferenceResponse } from '../clients/api-client';
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

    describe('spotlightParticipant', () => {
        it('should spotlight the participant and update the value in the cache', fakeAsync(() => {
            // Arrange
            const participantId = 'participant-id';
            const pexipParticipantId = 'pexip-participant-id';
            const conferenceId = 'conference-id';

            participantServiceSpy.getPexipIdForParticipant.and.returnValue(pexipParticipantId);

            // Act
            sut.spotlightParticipant(conferenceId, participantId);
            flush();

            // Assert
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
                participantState: {}
            };
            stateForConference.participantState[participantIdOne] = { isSpotlighted: true };
            stateForConference.participantState[participantIdTwo] = { isSpotlighted: true };
            stateForConference.participantState[participantIdThree] = { isSpotlighted: false };

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
                participantState: {}
            };
            stateForConference.participantState[participantIdOne] = { isSpotlighted: false };
            stateForConference.participantState[participantIdTwo] = { isSpotlighted: false };
            stateForConference.participantState[participantIdThree] = { isSpotlighted: false };

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
                participantState: {}
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
