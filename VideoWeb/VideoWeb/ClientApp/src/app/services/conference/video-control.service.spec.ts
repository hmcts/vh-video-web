import { fakeAsync, flush } from '@angular/core/testing';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ConferenceResponse } from '../clients/api-client';
import { Logger } from '../logging/logger-base';
import { ConferenceService } from './conference.service';
import { ParticipantService } from './participant.service';
import { VideoControlCacheService, VideoControlService } from './video-control.service';

fdescribe('VideoControlService', () => {
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let participantServiceSpy: jasmine.SpyObj<ParticipantService>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let videoControlCacheServiceSpy: jasmine.SpyObj<VideoControlCacheService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    let sut: VideoControlService;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>('ConferenceService', ['getConferenceById'], ['currentConference']);
        participantServiceSpy = jasmine.createSpyObj<ParticipantService>('ParticipantService', ['getPexipIdForParticipant']);
        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>('VideoCallService', ['spotlightParticipant']);
        videoControlCacheServiceSpy = jasmine.createSpyObj<VideoControlCacheService>('VideoControlCacheService', ['setSpotlightStatus']);
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error']);

        sut = new VideoControlService(
            conferenceServiceSpy,
            participantServiceSpy,
            videoCallServiceSpy,
            videoControlCacheServiceSpy,
            loggerSpy
        );
    });

    it('should be created', () => {
        expect(sut).toBeTruthy();
    });

    describe('spotlightParticipant', () => {
        it('should spotlight the participant and update the value in the cache', fakeAsync(() => {
            // Arrange
            const participantId = 'participant-id';
            const pexipParticipantId = 'pexip-participant-id';
            const conferenceId = 'conferenceId';

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference').and.returnValue(({
                id: conferenceId
            } as unknown) as ConferenceResponse);
            participantServiceSpy.getPexipIdForParticipant.and.returnValue(pexipParticipantId);

            // Act
            sut.spotlightParticipant(participantId);
            flush();

            // Assert
            expect(getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference')).toHaveBeenCalledTimes(1);
            expect(videoCallServiceSpy.spotlightParticipant).toHaveBeenCalledOnceWith(
                pexipParticipantId,
                true,
                conferenceId,
                participantId
            );
            expect(videoControlCacheServiceSpy.setSpotlightStatus).toHaveBeenCalledOnceWith(conferenceId, participantId, true);
        }));
    });
});
