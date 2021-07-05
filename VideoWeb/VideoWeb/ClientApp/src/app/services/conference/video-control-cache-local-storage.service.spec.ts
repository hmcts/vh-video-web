import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';
import { LocalStorageService } from './local-storage.service';

import { VideoControlCacheLocalStorageService } from './video-control-cache-local-storage.service';
import { IHearingControlsState, IHearingControlStates, IParticipantControlsState } from './video-control-cache-storage.service.interface';

describe('VideoControlCacheStorageService', () => {
    let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
    let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

    let service: VideoControlCacheLocalStorageService;

    beforeEach(() => {
        localStorageServiceSpy = jasmine.createSpyObj<LocalStorageService>('LocalStorageService', ['save', 'load']);
        loggerServiceSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'warn']);

        service = new VideoControlCacheLocalStorageService(localStorageServiceSpy, loggerServiceSpy);
    });

    describe('saveHearingStateForConference', () => {
        const conferenceId = 'confernece-id';
        const participantId = 'participant-id';

        let hearingControlsState: IHearingControlsState;
        let participantStates: { [participantId: string]: IParticipantControlsState };

        beforeEach(() => {
            participantStates = {};
            participantStates[participantId] = { isSpotlighted: true };

            hearingControlsState = { participantStates };
        });

        it('should write the new hearing control states into the cache', () => {
            // Arrange
            const initialHearingControlStates = undefined;
            const expectedHearingControlStates = {} as IHearingControlStates;
            expectedHearingControlStates[conferenceId] = {
                participantStates: participantStates
            };

            localStorageServiceSpy.load.and.returnValue(initialHearingControlStates);

            // Act
            service.saveHearingStateForConference(conferenceId, hearingControlsState);

            // Assert
            expect(localStorageServiceSpy.save).toHaveBeenCalledOnceWith(service.localStorageKey, expectedHearingControlStates);
        });
    });

    describe('loadHearingStateForConference', () => {
        const conferenceId = 'confernece-id';
        const participantId = 'participant-id';

        let hearingControlsState: IHearingControlStates;
        let participantStates: { [participantId: string]: IParticipantControlsState };

        beforeEach(() => {
            hearingControlsState = {};

            participantStates = {};
            participantStates[participantId] = { isSpotlighted: true };

            hearingControlsState[conferenceId] = { participantStates: participantStates };
        });

        it('should return the value from the cahce if it exists', fakeAsync(() => {
            // Arrange
            localStorageServiceSpy.load.and.returnValue(hearingControlsState);

            // Act
            let result = null;
            service.loadHearingStateForConference(conferenceId).subscribe(value => (result = value));
            flush();

            // Assert
            expect(result).toEqual(hearingControlsState[conferenceId]);
        }));

        it('should return an empty IHearingControlsState if the conference could NOT be found', fakeAsync(() => {
            // Arrange
            localStorageServiceSpy.load.and.returnValue(undefined);

            // Act
            let result = null;
            service.loadHearingStateForConference(conferenceId).subscribe(value => (result = value));
            flush();

            // Assert
            expect(result).toEqual({ participantStates: {} });
        }));
    });
});
