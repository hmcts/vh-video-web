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
            sut.loadFromLocalStorage();
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
            sut.loadFromLocalStorage();
            const result = sut.getStateForConference(conferenceId);

            // Act
            expect(result).toEqual({
                participantState: {}
            } as IHearingControlsState);
        });
    });

    describe('getSpotlightStatus', () => {
        it('should return true when the participants spotlight status is true', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            sut.hearingControlStates = {};
            sut.hearingControlStates[conferenceId] = {
                participantState: {}
            };
            sut.hearingControlStates[conferenceId].participantState[participantId] = {
                isSpotlighted: true
            };

            // Act
            const result = sut.getSpotlightStatus(conferenceId, participantId);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false when the participants spotlight status is false', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            sut.hearingControlStates = {};
            sut.hearingControlStates[conferenceId] = {
                participantState: {}
            };
            sut.hearingControlStates[conferenceId].participantState[participantId] = {
                isSpotlighted: false
            };

            // Act
            const result = sut.getSpotlightStatus(conferenceId, participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false when the participant cannot be found', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            sut.hearingControlStates = {};
            sut.hearingControlStates['conferenceId'] = {
                participantState: {}
            };
            sut.hearingControlStates[conferenceId].participantState['not-participant-id'] = {
                isSpotlighted: false
            };

            // Act
            const result = sut.getSpotlightStatus(conferenceId, participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false when the conference cannot be found', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            sut.hearingControlStates = {};
            sut.hearingControlStates['conferenceId'] = {
                participantState: {}
            };
            sut.hearingControlStates[conferenceId].participantState['not-conference-id'] = {
                isSpotlighted: false
            };

            // Act
            const result = sut.getSpotlightStatus(conferenceId, participantId);

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('setSpotlightStatus', () => {
        it('should set the participants spotlight value to true', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            // Act
            sut.setSpotlightStatus(conferenceId, participantId, true);

            // Assert
            expect(sut.hearingControlStates[conferenceId].participantState[participantId].isSpotlighted).toBeTrue();
        });

        it('should set the participants spotlight value to false', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            // Act
            sut.setSpotlightStatus(conferenceId, participantId, false);

            // Assert
            expect(sut.hearingControlStates[conferenceId].participantState[participantId].isSpotlighted).toBeTrue();
        });

        it('should update the participants spotlight value', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            sut.hearingControlStates = {};
            sut.hearingControlStates[conferenceId] = {
                participantState: {}
            };
            sut.hearingControlStates[conferenceId].participantState[participantId] = {
                isSpotlighted: true
            };

            // Act
            sut.setSpotlightStatus(conferenceId, participantId, false);

            // Assert
            expect(sut.hearingControlStates[conferenceId].participantState[participantId].isSpotlighted).toBeFalse();
        });
    });
});
