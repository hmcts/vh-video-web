import { of } from 'rxjs';
import { ApiClient } from '../clients/api-client';
import { LoggerService } from '../logging/logger.service';

import { DistributedVideoControlCacheService } from './distributed-video-control-cache.service';
import { IHearingControlsState, IHearingControlStates, IParticipantControlsState } from './video-control-cache-storage.service.interface';
import { Logger } from '../logging/logger-base';

describe('DistributedVideoControlCacheService', () => {
    let service: DistributedVideoControlCacheService;
    let loggerServiceSpy: jasmine.SpyObj<LoggerService>;
    let apiClientSpy: jasmine.SpyObj<ApiClient>;

    beforeEach(() => {
        loggerServiceSpy = jasmine.createSpyObj<LoggerService>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
        apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
            'getConferenceById',
            'getCurrentParticipant',
            'getParticipantsByConferenceId',
            'getVideoEndpointsForConference',
            'setVideoControlStatusesForConference',
            'getVideoControlStatusesForConference'
        ]);

        service = new DistributedVideoControlCacheService(apiClientSpy, loggerServiceSpy);
    });

    describe('saveHearingStateForConference', () => {
        const conferenceId = 'confernece-id';
        const participantId = 'participant-id';

        let hearingControlsState: IHearingControlsState;
        let participantStates: { [participantId: string]: IParticipantControlsState };

        beforeEach(() => {
            participantStates = {};
            participantStates[participantId] = { isLocalAudioMuted: true, isLocalVideoMuted: false };

            hearingControlsState = { participantStates };
        });
        it('should write the new hearing control states into the cache', () => {
            // Arrange
            const expectedHearingControlStates = {} as IHearingControlStates;
            expectedHearingControlStates[conferenceId] = {
                participantStates: participantStates
            };

            apiClientSpy.setVideoControlStatusesForConference.and.returnValue(of());

            // Act
            service.saveHearingStateForConference(conferenceId, hearingControlsState);

            // Assert
            expect(loggerServiceSpy.info).toHaveBeenCalledTimes(1);
        });
    });

    describe('loadHearingStateForConference', () => {
        const conferenceId = 'confernece-id';
        const participantId = 'participant-id';

        let hearingControlsState: IHearingControlsState;
        let participantStates: { [participantId: string]: IParticipantControlsState };

        beforeEach(() => {
            participantStates = {};
            participantStates[participantId] = { isLocalAudioMuted: true, isLocalVideoMuted: false };

            hearingControlsState = { participantStates };
        });
        it('should write the new hearing control states into the cache', () => {
            // Arrange
            const expectedHearingControlStates = {} as IHearingControlStates;
            expectedHearingControlStates[conferenceId] = {
                participantStates: participantStates
            };

            apiClientSpy.getVideoControlStatusesForConference.and.returnValue(of());

            // Act
            service.loadHearingStateForConference(conferenceId);

            // Assert
            expect(loggerServiceSpy.info).toHaveBeenCalledTimes(1);
        });
    });
});
