import { fakeAsync, flush } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { getSpiedPropertyGetter } from 'src/app/shared/jasmine-helpers/property-helpers';
import { ConferenceResponse } from '../clients/api-client';
import { LoggerService } from '../logging/logger.service';
import { ConferenceService } from './conference.service';
import { DistributedVideoControlCacheService } from './distributed-video-control-cache.service';
import { IHearingControlsState } from './video-control-cache-storage.service.interface';
import { VideoControlCacheService } from './video-control-cache.service';

describe('VideoControlCacheService', () => {
    let conferenceServiceSpy: jasmine.SpyObj<ConferenceService>;
    let currentConferenceSubject: Subject<ConferenceResponse>;
    let currentConference$: Observable<ConferenceResponse>;

    let videoControlCacheStorageServiceSpy: jasmine.SpyObj<DistributedVideoControlCacheService>;
    let loadHearingStateForConferenceSubject: Subject<IHearingControlsState>;
    let loadHearingStateForConference$: Observable<IHearingControlsState>;

    let loggerServiceSpy: jasmine.SpyObj<LoggerService>;

    let service: VideoControlCacheService;

    beforeEach(() => {
        conferenceServiceSpy = jasmine.createSpyObj<ConferenceService>(
            'ConferenceService',
            ['getConferenceById'],
            ['currentConference$', 'currentConferenceId']
        );

        currentConferenceSubject = new Subject<ConferenceResponse>();
        currentConference$ = currentConferenceSubject.asObservable();
        getSpiedPropertyGetter(conferenceServiceSpy, 'currentConference$').and.returnValue(currentConference$);

        videoControlCacheStorageServiceSpy = jasmine.createSpyObj<DistributedVideoControlCacheService>(
            'VideoControlCacheLocalStorageService',
            ['saveHearingStateForConference', 'loadHearingStateForConference']
        );

        loadHearingStateForConferenceSubject = new Subject<IHearingControlsState>();
        loadHearingStateForConference$ = loadHearingStateForConferenceSubject.asObservable();
        videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(loadHearingStateForConference$);
        videoControlCacheStorageServiceSpy.saveHearingStateForConference.and.returnValue(of(null));

        loggerServiceSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'warn']);

        service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);
    });

    describe('initialisation', () => {
        it('should NOT load the hearing state if there is no current conference', fakeAsync(() => {
            // Arrange
            const hearingControlsState: IHearingControlsState = { participantStates: {} };

            // Act
            currentConferenceSubject.next(null);
            flush();
            loadHearingStateForConferenceSubject.next(hearingControlsState);
            flush();

            // Assert
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).not.toHaveBeenCalled();
            expect(service['hearingControlStates']).toEqual(hearingControlsState);
        }));

        it('should load the hearing state for the current conference', fakeAsync(() => {
            // Arrange
            const conferenceId = 'conference-id';
            const conference = { id: conferenceId } as ConferenceResponse;

            const hearingControlsState: IHearingControlsState = { participantStates: {} };

            // Act
            currentConferenceSubject.next(conference);
            flush();
            loadHearingStateForConferenceSubject.next(hearingControlsState);
            flush();

            // Assert
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).toHaveBeenCalledOnceWith(conferenceId);
            expect(service['hearingControlStates']).toEqual(hearingControlsState);
        }));
    });

    describe('setSpotlightStatus', () => {
        it('should add new value in the hearingControlStates and should update the cache', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const spotlight = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isSpotlighted: spotlight };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setSpotlightStatus(participantId, spotlight);
            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const spotlight = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isSpotlighted: !spotlight };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isSpotlighted: spotlight };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setSpotlightStatus(participantId, spotlight);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing property values', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isSpotlighted = false;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: !isSpotlighted
            };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setSpotlightStatus(participantId, isSpotlighted);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const spotlight = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            service.setSpotlightStatus(participantId, spotlight);

            // Assert
            expect(service['hearingControlStates']).toEqual(null);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });
    });

    describe('getSpotlightStatus', () => {
        it('should return the value for the participant (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isSpotlighted: false };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getSpotlightStatus(participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return the value for the participant (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isSpotlighted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getSpotlightStatus(participantId);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false if the participant cannot be found', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isSpotlighted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getSpotlightStatus('not' + participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false if the state has NOT being retrieved', () => {
            // Arrange
            const participantId = 'participant-id';
            service['hearingControlStates'] = null;

            // Act
            const result = service.getSpotlightStatus(participantId);

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('setLocalAudioMuted', () => {
        it('should add new value in the hearingControlStates and should update the cache', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isLocalAudioMuted: isLocalAudioMuted };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setLocalAudioMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalAudioMuted: !isLocalAudioMuted };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isLocalAudioMuted: isLocalAudioMuted };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setLocalAudioMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing propertie values', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isSpotlighted = false;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: !isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted
            };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setLocalAudioMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalVideoMuted = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            service.setLocalAudioMuted(participantId, isLocalVideoMuted);

            // Assert
            expect(service['hearingControlStates']).toEqual(null);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });
    });

    describe('getLocalAudioMuted', () => {
        it('should return the value for the participant (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalAudioMuted: false };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getLocalAudioMuted(participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return the value for the participant (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalAudioMuted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getLocalAudioMuted(participantId);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false if the participant cannot be found', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalAudioMuted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getLocalAudioMuted('not' + participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false if the state has NOT being retrieved', () => {
            // Arrange
            const participantId = 'participant-id';
            service['hearingControlStates'] = null;

            // Act
            const result = service.getLocalAudioMuted(participantId);

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('setLocalVideoMuted', () => {
        it('should add new value in the hearingControlStates and should update the cache', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalVideoMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isLocalVideoMuted: isLocalVideoMuted };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setLocalVideoMuted(participantId, isLocalVideoMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalVideoMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalVideoMuted: !isLocalVideoMuted };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isLocalVideoMuted: isLocalVideoMuted };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setLocalVideoMuted(participantId, isLocalVideoMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing propertie values', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isSpotlighted = false;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: !isLocalVideoMuted,
                isSpotlighted: isSpotlighted
            };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.setLocalVideoMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalVideoMuted = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            service.setLocalVideoMuted(participantId, isLocalVideoMuted);

            // Assert
            expect(service['hearingControlStates']).toEqual(null);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });
    });

    describe('getLocalVideoMuted', () => {
        it('should return the value for the participant (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalVideoMuted: false };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getLocalVideoMuted(participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return the value for the participant (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalVideoMuted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getLocalVideoMuted(participantId);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false if the participant cannot be found', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isLocalVideoMuted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getLocalVideoMuted('not' + participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false if the state has NOT being retrieved', () => {
            // Arrange
            const participantId = 'participant-id';
            service['hearingControlStates'] = null;

            // Act
            const result = service.getLocalVideoMuted(participantId);

            // Assert
            expect(result).toBeFalse();
        });
    });
});
