import { TestBed } from '@angular/core/testing';
import { LoggerService } from '../logging/logger.service';

import { IHearingControlsState, IHearingControlStates, VideoControlCacheService } from './video-control-cache.service';

describe('VideoControlCacheService', () => {
    let sut: VideoControlCacheService;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
        loggerSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['warn', 'info']);
        sut = new VideoControlCacheService(loggerSpy);

        window.localStorage.clear();
    });

    it('should load settings from local storage when constructed', () => {
        // Arrange
        const conferenceIdOne = 'conference-id-one';
        const conferenceIdTwo = 'conference-id-two';
        const hearingStates: IHearingControlStates = {};
        hearingStates[conferenceIdOne] = {
            participantStates: {
                'participant-id': {
                    isSpotlighted: false
                }
            }
        };

        hearingStates[conferenceIdTwo] = {
            participantStates: {
                'participant-id': {
                    isSpotlighted: false
                }
            }
        };

        window.localStorage.setItem(sut.localStorageKey, JSON.stringify(hearingStates));

        // Act
        const service = new VideoControlCacheService(loggerSpy);

        // Assert
        expect(service.hearingControlStates).toEqual(hearingStates);
    });

    describe('getStateForConference', () => {
        it('should return the conference from session storage', () => {
            // Arrange
            const conferenceId = 'conference-id';

            const hearingState: { [conferenceId: string]: IHearingControlsState } = {};
            hearingState[conferenceId] = {
                participantStates: {
                    'participant-id': {
                        isSpotlighted: false
                    }
                }
            };

            hearingState['not-conference-id'] = {
                participantStates: {
                    'participant-id': {
                        isSpotlighted: false
                    }
                }
            };

            window.localStorage.setItem(sut.localStorageKey, JSON.stringify(hearingState));

            // Act
            sut['loadFromLocalStorage']();
            const result = sut.getStateForConference(conferenceId);

            // Act
            expect(result).toEqual(hearingState[conferenceId]);
        });

        it('should return an empty result if the conference could not be found', () => {
            // Arrange
            const conferenceId = 'conference-id';

            const hearingState: { [conferenceId: string]: IHearingControlsState } = {};
            hearingState['not-conference-id'] = {
                participantStates: {
                    'participant-id': {
                        isSpotlighted: false
                    }
                }
            };

            window.localStorage.setItem(sut.localStorageKey, JSON.stringify(hearingState));

            // Act
            sut['loadFromLocalStorage']();
            const result = sut.getStateForConference(conferenceId);

            // Act
            expect(result).toEqual({
                participantStates: {}
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
                participantStates: {}
            };
            sut.hearingControlStates[conferenceId].participantStates[participantId] = {
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
                participantStates: {}
            };
            sut.hearingControlStates[conferenceId].participantStates[participantId] = {
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
            sut.hearingControlStates[conferenceId] = {
                participantStates: {}
            };
            sut.hearingControlStates[conferenceId].participantStates['not-participant-id'] = {
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
            sut.hearingControlStates['not-conference-id'] = {
                participantStates: {}
            };
            sut.hearingControlStates['not-conference-id'].participantStates[participantId] = {
                isSpotlighted: false
            };

            // Act
            const result = sut.getSpotlightStatus(conferenceId, participantId);

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('setSpotlightStatus', () => {
        it('should set the participants spotlight value to true and save it to the local session storage', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            // Act
            sut.setSpotlightStatus(conferenceId, participantId, true);

            // Assert
            expect(sut.hearingControlStates[conferenceId].participantStates[participantId].isSpotlighted).toBeTrue();
            expect(
                JSON.parse(window.localStorage.getItem(sut.localStorageKey))[conferenceId].participantStates[participantId].isSpotlighted
            ).toBeTrue();
        });

        it('should set the participants spotlight value to false and save it to the local session storage', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            // Act
            sut.setSpotlightStatus(conferenceId, participantId, false);

            // Assert
            expect(sut.hearingControlStates[conferenceId].participantStates[participantId].isSpotlighted).toBeFalse();
            expect(
                JSON.parse(window.localStorage.getItem(sut.localStorageKey))[conferenceId].participantStates[participantId].isSpotlighted
            ).toBeFalse();
        });

        it('should update the participants spotlight value and save it to the local session storage', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';

            sut.hearingControlStates = {};
            sut.hearingControlStates[conferenceId] = {
                participantStates: {}
            };
            sut.hearingControlStates[conferenceId].participantStates[participantId] = {
                isSpotlighted: true
            };

            // Act
            sut.setSpotlightStatus(conferenceId, participantId, false);

            // Assert
            expect(sut.hearingControlStates[conferenceId].participantStates[participantId].isSpotlighted).toBeFalse();

            expect(
                JSON.parse(window.localStorage.getItem(sut.localStorageKey))[conferenceId].participantStates[participantId].isSpotlighted
            ).toBeFalse();
        });
    });
});
