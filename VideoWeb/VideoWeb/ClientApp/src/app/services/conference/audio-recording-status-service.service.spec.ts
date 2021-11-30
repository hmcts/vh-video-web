import { fakeAsync, flush, TestBed } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { Subject } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ParticipantUpdated } from 'src/app/waiting-space/models/video-call-models';
import { VideoCallService } from 'src/app/waiting-space/services/video-call.service';
import { ConfigService } from '../api/config.service';
import { ClientSettingsResponse } from '../clients/api-client';
import { LoggerService } from '../logging/logger.service';

import { AudioRecordingStatusServiceService } from './audio-recording-status-service.service';

describe('AudioRecordingStatusServiceService', () => {
    let service: AudioRecordingStatusServiceService;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let getClientSettingsSubject: Subject<ClientSettingsResponse>;
    let videoCallServiceSpy: jasmine.SpyObj<VideoCallService>;
    let onParticipantCreatedSubject: Subject<ParticipantUpdated>;
    let onParticipantDeletedSubject: Subject<Guid>;

    beforeEach(() => {
        configServiceSpy = jasmine.createSpyObj<ConfigService>(['getClientSettings']);
        getClientSettingsSubject = new Subject<ClientSettingsResponse>();
        configServiceSpy.getClientSettings.and.returnValue(getClientSettingsSubject.asObservable());

        videoCallServiceSpy = jasmine.createSpyObj<VideoCallService>(['onParticipantCreated', 'onParticipantDeleted']);
        onParticipantCreatedSubject = new Subject<ParticipantUpdated>();
        videoCallServiceSpy.onParticipantCreated.and.returnValue(onParticipantCreatedSubject);
        onParticipantDeletedSubject = new Subject<Guid>();
        videoCallServiceSpy.onParticipantDeleted.and.returnValue(onParticipantDeletedSubject);

        TestBed.configureTestingModule({
            providers: [
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: VideoCallService, useValue: videoCallServiceSpy },
                { provide: LoggerService, useValue: jasmine.createSpyObj<LoggerService>(['info', 'debug', 'event']) }
            ]
        });

        service = TestBed.inject(AudioRecordingStatusServiceService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get client settings and subscribe to the participant created and participant deleted events', fakeAsync(() => {
        // Arrange
        const recorderDisplayName = 'test';
        const onParticipantCreatedSubscribeSpy = spyOn(onParticipantCreatedSubject, 'subscribe');
        const onParticipantDeletedSubscribeSpy = spyOn(onParticipantDeletedSubject, 'subscribe');

        // Act
        getClientSettingsSubject.next({ wowza_recorder_pexip_display_name: recorderDisplayName } as ClientSettingsResponse);
        flush();

        // Assert
        expect(onParticipantCreatedSubscribeSpy).toHaveBeenCalledTimes(1);
        expect(onParticipantDeletedSubscribeSpy).toHaveBeenCalledTimes(1);
    }));

    it('should emit isRecorderInCall$ with true when the recorder participant is created', fakeAsync(() => {
        // Arrange
        const recorderDisplayName = 'test';
        getClientSettingsSubject.next({ wowza_recorder_pexip_display_name: recorderDisplayName } as ClientSettingsResponse);
        flush();

        // Act
        let isRecorderInCall: boolean | null = null;
        service.isRecorderInCall$.subscribe(value => (isRecorderInCall = value));

        onParticipantCreatedSubject.next({ pexipDisplayName: recorderDisplayName, uuid: Guid.EMPTY } as ParticipantUpdated);
        flush();

        // Assert
        expect(isRecorderInCall).toBeTrue();
    }));

    it('should NOT emit isRecorderInCall$ with true when a participant is created with a display name that does NOT match the expected recorder display name', fakeAsync(() => {
        // Arrange
        const recorderDisplayName = 'test';
        getClientSettingsSubject.next({ wowza_recorder_pexip_display_name: recorderDisplayName } as ClientSettingsResponse);
        flush();

        // Act
        let isRecorderInCall: boolean | null = null;
        service.isRecorderInCall$.subscribe(value => (isRecorderInCall = value));

        onParticipantCreatedSubject.next({ pexipDisplayName: 'not-test', uuid: Guid.EMPTY } as ParticipantUpdated);
        flush();

        // Assert
        expect(isRecorderInCall).toBeFalse();
    }));

    it('should emit isRecorderInCall$ with false when the recorder participant is deleted', fakeAsync(() => {
        // Arrange
        const recorderDisplayName = 'test';
        const recorderPexipId = Guid.create();
        getClientSettingsSubject.next({ wowza_recorder_pexip_display_name: recorderDisplayName } as ClientSettingsResponse);
        onParticipantCreatedSubject.next({ pexipDisplayName: recorderDisplayName, uuid: recorderPexipId.toString() } as ParticipantUpdated);
        flush();

        // Act
        let isRecorderInCall: boolean | null = null;
        service.isRecorderInCall$.pipe(skip(1)).subscribe(value => (isRecorderInCall = value));

        onParticipantDeletedSubject.next(recorderPexipId);
        flush();

        // Assert
        expect(isRecorderInCall).toBeFalse();
    }));

    it('should NOT emit isRecorderInCall$ when a participant is deleted that is NOT the recorder', fakeAsync(() => {
        // Arrange
        const recorderDisplayName = 'test';
        const recorderPexipId = Guid.create();
        getClientSettingsSubject.next({ wowza_recorder_pexip_display_name: recorderDisplayName } as ClientSettingsResponse);
        onParticipantCreatedSubject.next({ pexipDisplayName: recorderDisplayName, uuid: recorderPexipId.toString() } as ParticipantUpdated);
        flush();

        // Act
        let isRecorderInCall: boolean | null = null;
        service.isRecorderInCall$.subscribe(value => (isRecorderInCall = value));

        onParticipantDeletedSubject.next(Guid.create());
        flush();

        // Assert
        expect(isRecorderInCall).toBeTrue();
    }));
});
