import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Guid } from 'guid-typescript';
import { AudioRecordingService } from 'src/app/services/api/audio-recording.service';
import { ConferenceResponse, ConferenceStatus, LoggedParticipantResponse, ParticipantResponse } from 'src/app/services/clients/api-client';
import { ConferenceStatusMessage } from 'src/app/services/models/conference-status-message';
import { Hearing } from 'src/app/shared/models/hearing';
import { pageUrls } from 'src/app/shared/page-url.constants';
import { hearingStatusSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import {
    activatedRoute,
    adalService,
    consultationService,
    deviceTypeService,
    errorService,
    eventsService,
    globalConference,
    globalParticipant,
    heartbeatModelMapper,
    initAllWRDependencies,
    logger,
    notificationSoundsService,
    notificationToastrService,
    router,
    userMediaService,
    userMediaStreamService,
    videoCallService,
    videoWebService
} from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { JudgeWaitingRoomComponent } from '../judge-waiting-room.component';

describe('JudgeWaitingRoomComponent when conference exists', () => {
    let component: JudgeWaitingRoomComponent;
    const hearingStatusSubject = hearingStatusSubjectMock;
    let audioRecordingService: jasmine.SpyObj<AudioRecordingService>;

    beforeAll(() => {
        initAllWRDependencies();
        audioRecordingService = jasmine.createSpyObj<AudioRecordingService>('AudioRecordingService', ['getAudioStreamInfo']);
    });

    beforeEach(async () => {
        component = new JudgeWaitingRoomComponent(
            activatedRoute,
            videoWebService,
            eventsService,
            adalService,
            logger,
            errorService,
            heartbeatModelMapper,
            videoCallService,
            deviceTypeService,
            router,
            consultationService,
            audioRecordingService,
            userMediaService,
            userMediaStreamService,
            notificationSoundsService,
            notificationToastrService
        );

        const conference = new ConferenceResponse(Object.assign({}, globalConference));
        const participant = new ParticipantResponse(Object.assign({}, globalParticipant));
        component.hearing = new Hearing(conference);
        component.conference = conference;
        component.participant = participant;
        component.connected = true; // assume connected to pexip
        component.startEventHubSubscribers();
        videoWebService.getConferenceById.calls.reset();
        router.navigate.calls.reset();
    });

    afterEach(() => {
        component.eventHubSubscription$.unsubscribe();
    });

    it('should return to judge hearing list when "closed" message received', fakeAsync(() => {
        expect(component.displayDeviceChangeModal).toBeFalsy();
        const status = ConferenceStatus.Closed;
        const confWithCloseTime = new ConferenceResponse(Object.assign({}, globalConference));
        confWithCloseTime.closed_date_time = new Date();
        confWithCloseTime.status = status;
        videoWebService.getConferenceById.and.resolveTo(confWithCloseTime);
        videoWebService.getCurrentParticipant.and.resolveTo(
            new LoggedParticipantResponse({
                participant_id: globalParticipant.id,
                display_name: globalParticipant.display_name,
                role: globalParticipant.role
            })
        );

        const message = new ConferenceStatusMessage(globalConference.id, status);

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(component.hearing.status).toBe(status);
        expect(component.conference.status).toBe(status);
        expect(component.showVideo).toBeFalsy();
        expect(videoWebService.getConferenceById).toHaveBeenCalledWith(globalConference.id);
        expect(component.getConferenceStatusText()).toBe('Hearing is closed');
        expect(router.navigate).toHaveBeenCalledWith([pageUrls.JudgeHearingList]);
    }));

    it('should ignore "closed" message for another conference', fakeAsync(() => {
        const status = ConferenceStatus.Closed;
        const confWithCloseTime = new ConferenceResponse(Object.assign({}, globalConference));
        confWithCloseTime.closed_date_time = new Date();
        confWithCloseTime.status = status;
        router.navigate.calls.reset();

        const message = new ConferenceStatusMessage(Guid.create().toString(), status);

        hearingStatusSubject.next(message);
        flushMicrotasks();

        expect(router.navigate).toHaveBeenCalledTimes(0);
    }));
});
