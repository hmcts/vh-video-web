import { TestBed } from '@angular/core/testing';

import { IHearingControlsState, VideoControlCacheService } from './video-control-cache.service';

fdescribe('VideoControlCacheService', () => {
    let sut: VideoControlCacheService;

    beforeEach(() => {
        sut = new VideoControlCacheService();
    });

    it('should be created', () => {
        expect(sut).toBeTruthy();
    });

    describe('getStateForConference', () => {
        it('should return the conference from session storage', () => {
            // Arrange
            const conferenceId = 'conference-id';

            var hearingState: { [conferenceId: string]: IHearingControlsState } = {};
            hearingState[conferenceId] = {
                participantState: {
                    'participant-id': {
                        isSpotlighted: false
                    }
                }
            };

            hearingState['not-conference-id'] = {
                participantState: {
                    'participant-id': {
                        isSpotlighted: false
                    }
                }
            };

            window.localStorage.setItem(sut.localStorageKey, JSON.stringify(hearingState));

            // Act
            const result = sut.getStateForConference(conferenceId);

            // Act
            expect(result).toEqual(hearingState[conferenceId]);
        });

        it('should return an empty result if the conference could not be found', () => {
            // Arrange
            const conferenceId = 'conference-id';

            var hearingState: { [conferenceId: string]: IHearingControlsState } = {};
            hearingState['not-conference-id'] = {
                participantState: {
                    'participant-id': {
                        isSpotlighted: false
                    }
                }
            };

            window.localStorage.setItem(sut.localStorageKey, JSON.stringify(hearingState));

            // Act
            const result = sut.getStateForConference(conferenceId);

            // Act
            expect(result).toEqual({
                participantState: {}
            } as IHearingControlsState);
        });
    });
});
