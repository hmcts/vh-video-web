import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { EventType, UpdateParticipantStatusEventRequest } from './clients/api-client';
import { JudgeEventService } from './judge-event.service';

describe('JudgeEventService', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['raiseParticipantEvent']);
    videoWebServiceSpy.raiseParticipantEvent.and.returnValue(of());
    const service = new JudgeEventService(videoWebServiceSpy, new MockLogger());

    it('should raise judge available event', () => {
        const conferenceId = '4321';
        const request = new UpdateParticipantStatusEventRequest({
            event_type: EventType.JudgeAvailable
        });
        service.raiseJudgeAvailableEvent(conferenceId);
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalledWith(conferenceId, request);
    });
    it('should raise judge unavailable event', () => {
        const conferenceId = '4321';
        const request = new UpdateParticipantStatusEventRequest({
            event_type: EventType.JudgeUnavailable
        });
        service.raiseJudgeUnavailableEvent(conferenceId);
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalledWith(conferenceId, request);
    });
});

describe('JudgeEventService failure', () => {
    const error = { error: 'failed to raise event' };
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['raiseParticipantEvent']);
    videoWebServiceSpy.raiseParticipantEvent.and.callFake(() => Promise.reject(error));
    let logger: MockLogger;
    let service: JudgeEventService;

    beforeEach(() => {
        logger = new MockLogger();
        service = new JudgeEventService(videoWebServiceSpy, logger);
    });

    it('should log error when fails to judge available event', async () => {
        spyOn(logger, 'error');
        const conferenceId = '4321';
        const request = new UpdateParticipantStatusEventRequest({
            event_type: EventType.JudgeAvailable
        });
        await service.raiseJudgeAvailableEvent(conferenceId);
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalledWith(conferenceId, request);
        expect(logger.error).toHaveBeenCalled();
    });

    it('should log error when fails raise judge unavailable event', async () => {
        spyOn(logger, 'error');
        const conferenceId = '4321';
        const request = new UpdateParticipantStatusEventRequest({
            event_type: EventType.JudgeUnavailable
        });
        await service.raiseJudgeUnavailableEvent(conferenceId);
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalledWith(conferenceId, request);
        expect(logger.error).toHaveBeenCalled();
    });
});
