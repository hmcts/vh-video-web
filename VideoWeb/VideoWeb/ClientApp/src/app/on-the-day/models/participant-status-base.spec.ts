import { fakeAsync, tick } from '@angular/core/testing';
import { ParticipantStatusBaseDirective } from 'src/app/on-the-day/models/participant-status-base';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';

class ParticipantStatusBaseTestComponent extends ParticipantStatusBaseDirective {
    conferenceId = '123456789';
    constructor(
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger
    ) {
        super(participantStatusUpdateService, logger);
    }
}

describe('ParticipantStatusBase', () => {
    const loggerMock: Logger = new MockLogger();
    const participantStatusUpdateServiceSpy = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

    const component = new ParticipantStatusBaseTestComponent(participantStatusUpdateServiceSpy, loggerMock);

    it('should update participant status on log out', fakeAsync(() => {
        const event: any = { returnValue: 'save' };
        participantStatusUpdateServiceSpy.postParticipantStatus.and.returnValue(Promise.resolve());

        component.beforeunloadHandler(event);
        tick();
        expect(participantStatusUpdateServiceSpy.postParticipantStatus).toHaveBeenCalled();
    }));
    it('should throw error message when update participant status on log out', fakeAsync(() => {
        const event: any = { returnValue: 'save' };
        spyOn(loggerMock, 'error');
        participantStatusUpdateServiceSpy.postParticipantStatus.and.returnValue(Promise.reject());
        component.beforeunloadHandler(event);
        tick();
        expect(participantStatusUpdateServiceSpy.postParticipantStatus).toHaveBeenCalled();
        expect(loggerMock.error).toHaveBeenCalled();
    }));
});
