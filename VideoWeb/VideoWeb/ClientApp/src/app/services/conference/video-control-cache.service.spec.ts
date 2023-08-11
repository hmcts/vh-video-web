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

        loggerServiceSpy = jasmine.createSpyObj<LoggerService>('LoggerService', ['info', 'warn', 'debug']);

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
        beforeEach(() => {
            const dummyState: IHearingControlsState = { participantStates: {} };
            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(dummyState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);
        });
        it('should add new value in the hearingControlStates and should update the cache', async () => {
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
            await service.setSpotlightStatus(participantId, spotlight);
            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', async () => {
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
            await service.setSpotlightStatus(participantId, spotlight);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing property values', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isRemoteMuted = true;
            const isSpotlighted = false;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: !isSpotlighted,
                isRemoteMuted: isRemoteMuted
            };

            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(initialHearingControlsState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted,
                isRemoteMuted: isRemoteMuted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            await service.setSpotlightStatus(participantId, isSpotlighted);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const spotlight = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            await service.setSpotlightStatus(participantId, spotlight);

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

    describe('setRemoteMuteStatus', () => {
        beforeEach(() => {
            const dummyState: IHearingControlsState = { participantStates: {} };
            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(dummyState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);
        });

        it('should add new value in the hearingControlStates and should update the cache', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const remoteMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isRemoteMuted: remoteMuted };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setRemoteMutedStatus(participantId, remoteMuted);
            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const remoteMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isRemoteMuted: !remoteMuted };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isRemoteMuted: remoteMuted };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setRemoteMutedStatus(participantId, remoteMuted);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing property values', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isRemoteMuted = false;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isRemoteMuted: !isRemoteMuted
            };

            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(initialHearingControlsState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isRemoteMuted: isRemoteMuted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            await service.setRemoteMutedStatus(participantId, isRemoteMuted);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const remoteMuted = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            await service.setRemoteMutedStatus(participantId, remoteMuted);

            // Assert
            expect(service['hearingControlStates']).toEqual(null);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });
    });
    describe('getRemoteMuteStatus', () => {
        it('should return the value for the participant (false)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isRemoteMuted: false };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getRemoteMutedStatus(participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return the value for the participant (true)', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isRemoteMuted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getRemoteMutedStatus(participantId);

            // Assert
            expect(result).toBeTrue();
        });

        it('should return false if the participant cannot be found', () => {
            // Arrange
            const participantId = 'participant-id';
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isRemoteMuted: true };

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            const result = service.getRemoteMutedStatus('not' + participantId);

            // Assert
            expect(result).toBeFalse();
        });

        it('should return false if the state has NOT being retrieved', () => {
            // Arrange
            const participantId = 'participant-id';
            service['hearingControlStates'] = null;

            // Act
            const result = service.getRemoteMutedStatus(participantId);

            // Assert
            expect(result).toBeFalse();
        });
    });

    describe('setLocalAudioMuted', () => {
        beforeEach(() => {
            const dummyState: IHearingControlsState = { participantStates: {} };
            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(dummyState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);
        });
        it('should add new value in the hearingControlStates and should update the cache', async () => {
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
            await service.setLocalAudioMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', async () => {
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
            await service.setLocalAudioMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing propertie values', async () => {
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

            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(initialHearingControlsState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            await service.setLocalAudioMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalVideoMuted = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            await service.setLocalAudioMuted(participantId, isLocalVideoMuted);

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
        beforeEach(() => {
            const dummyState: IHearingControlsState = { participantStates: {} };
            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(dummyState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);
        });

        it('should add new value in the hearingControlStates and should update the cache', async () => {
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
            await service.setLocalVideoMuted(participantId, isLocalVideoMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache', async () => {
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
            await service.setLocalVideoMuted(participantId, isLocalVideoMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing propertie values', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isSpotlighted = false;
            const isRemoteMuted = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: !isLocalVideoMuted,
                isSpotlighted: isSpotlighted,
                isRemoteMuted: isRemoteMuted
            };

            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(initialHearingControlsState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted,
                isRemoteMuted: isRemoteMuted
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            // Act
            await service.setLocalVideoMuted(participantId, isLocalAudioMuted, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalVideoMuted = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            await service.setLocalVideoMuted(participantId, isLocalVideoMuted);

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
    describe('clearHandRaiseStatusForAll', () => {
        it('should update hearingControlStates for all participants to false and should update the cache sync changes true', () => {
            // Arrange
            const conferenceId = 'conference-id';
            const handRaiseStatus = true;
            const noOfParticipants = 10;
            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            for (let i = 0; i < noOfParticipants; i++) {
                initialHearingControlsState.participantStates[i] = { isHandRaised: handRaiseStatus };
            }
            for (let i = 0; i < noOfParticipants; i++) {
                expectedHearingControlsState.participantStates[i] = { isHandRaised: !handRaiseStatus };
            }

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            service.clearHandRaiseStatusForAll(conferenceId);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });
    });
    describe('setHandRaiseStatus', () => {
        beforeEach(() => {
            const dummyState: IHearingControlsState = { participantStates: {} };
            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(dummyState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);
        });

        it('should add new value in the hearingControlStates and should update the cache sync changes true', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const handRaiseStatus = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isHandRaised: handRaiseStatus };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setHandRaiseStatus(participantId, handRaiseStatus, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).toHaveBeenCalled();
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should add new value in the hearingControlStates and should update the cache sync changes false', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const handRaiseStatus = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isHandRaised: handRaiseStatus };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setHandRaiseStatus(participantId, handRaiseStatus, false);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).toHaveBeenCalled();
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });

        it('should update the value in the hearingControlStates and should update the cache syncChanges true', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const handRaiseStatus = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isHandRaised: !handRaiseStatus };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isHandRaised: handRaiseStatus };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setHandRaiseStatus(participantId, handRaiseStatus, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).toHaveBeenCalled();
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should update the value in the hearingControlStates and should update the cache syncChanges false', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const handRaiseStatus = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = { isHandRaised: !handRaiseStatus };

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = { isHandRaised: handRaiseStatus };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setHandRaiseStatus(participantId, handRaiseStatus, false);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).toHaveBeenCalled();
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });

        it('should update the value in the hearingControlStates and should update the cache and should retain existing properties values', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const isLocalAudioMuted = true;
            const isLocalVideoMuted = true;
            const isSpotlighted = false;
            const isRemoteMuted = true;
            const isHandRaised = true;

            const initialHearingControlsState: IHearingControlsState = { participantStates: {} };
            initialHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted,
                isRemoteMuted: isRemoteMuted,
                isHandRaised: !isHandRaised
            };

            videoControlCacheStorageServiceSpy.loadHearingStateForConference.and.returnValue(of(initialHearingControlsState));
            service = new VideoControlCacheService(conferenceServiceSpy, videoControlCacheStorageServiceSpy, loggerServiceSpy);

            const expectedHearingControlsState: IHearingControlsState = { participantStates: {} };
            expectedHearingControlsState.participantStates[participantId] = {
                isLocalAudioMuted: isLocalAudioMuted,
                isLocalVideoMuted: isLocalVideoMuted,
                isSpotlighted: isSpotlighted,
                isRemoteMuted: isRemoteMuted,
                isHandRaised: isHandRaised
            };

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = initialHearingControlsState;

            // Act
            await service.setHandRaiseStatus(participantId, isHandRaised, true);

            // Assert
            expect(service['hearingControlStates']).toEqual(expectedHearingControlsState);
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).toHaveBeenCalled();
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).toHaveBeenCalledOnceWith(
                conferenceId,
                expectedHearingControlsState
            );
        });

        it('should do nothing if the hearing control state is not initialised', async () => {
            // Arrange
            const conferenceId = 'conference-id';
            const participantId = 'participant-id';
            const handRaiseStatus = true;

            getSpiedPropertyGetter(conferenceServiceSpy, 'currentConferenceId').and.returnValue(conferenceId);

            service['hearingControlStates'] = null;

            // Act
            await service.setHandRaiseStatus(participantId, handRaiseStatus);

            // Assert
            expect(service['hearingControlStates']).toEqual(null);
            expect(videoControlCacheStorageServiceSpy.loadHearingStateForConference).not.toHaveBeenCalled();
            expect(videoControlCacheStorageServiceSpy.saveHearingStateForConference).not.toHaveBeenCalled();
        });
    });

    describe('getHandRaiseStatus', () => {
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
