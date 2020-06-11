import { ParticipantStatusBase } from 'src/app/on-the-day/models/participant-status-base';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ActivatedRoute } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';

class ParticipantStatusBaseTest extends ParticipantStatusBase {
    constructor(
        protected participantStatusUpdateService: ParticipantStatusUpdateService,
        protected logger: Logger,
        protected route: ActivatedRoute
    ) {
        super(participantStatusUpdateService, logger, route);
    }
}

describe('ParticipantStatusBase', () => {
    const activatedRoute: any = { snapshot: { paramMap: convertToParamMap({ conferenceId: '1234567' }) } };
    const loggerMock: Logger = new MockLogger();
    let participantStatusUpdateServiceSpy: jasmine.SpyObj<ParticipantStatusUpdateService>;
    participantStatusUpdateServiceSpy = jasmine.createSpyObj('ParticipantStatusUpdateService', ['postParticipantStatus']);

    const component = new ParticipantStatusBaseTest(participantStatusUpdateServiceSpy, loggerMock, activatedRoute);

    it('should update participant status on log out', () => {
        const event: any = { returnValue: 'save' };
        component.beforeunloadHandler(event);
        expect(participantStatusUpdateServiceSpy.postParticipantStatus).toHaveBeenCalled();
    });
});
