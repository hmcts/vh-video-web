import { Router } from '@angular/router';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { Logger } from 'src/app/services/logging/logger-base';
import { TestBed, fakeAsync } from '@angular/core/testing';

class MockRouter {
    public url = '/check-equipment/1234-1234-1234';
}

describe('ParticipantStatusUpdateService', () => {

    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['raiseParticipantEvent']);
    videoWebServiceSpy.raiseParticipantEvent.and.returnValue(Promise.resolve());
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ParticipantStatusUpdateService,
                { provide: Router, useValue: MockRouter },
                { provide: VideoWebService, useValue: videoWebServiceSpy },
                { provide: Logger, useClass: MockLogger }
            ]
        });
    });

    it('should raise participant event with event type not signed in', async () => {
        const service = TestBed.get(ParticipantStatusUpdateService);
        const router = TestBed.get(Router);
        router.url = '/introduction/566788899';
        await service.postParticipantStatus();
        expect(videoWebServiceSpy.raiseParticipantEvent).toHaveBeenCalled();
    });
});
