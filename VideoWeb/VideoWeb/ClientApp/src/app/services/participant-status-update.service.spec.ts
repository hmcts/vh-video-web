import { Router } from '@angular/router';
import { ParticipantStatusUpdateService } from 'src/app/services/participant-status-update.service';
import { MockLogger } from 'src/app/testing/mocks/MockLogger';
import { ApiClient, EventType } from 'src/app/services/clients/api-client';
import { of } from 'rxjs';

describe('ParticipantStatusUpdateService', () => {
    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['updateParticipantStatus']);
    apiClientSpy.updateParticipantStatus.and.returnValue(of());

    let routerSpy: jasmine.SpyObj<Router>;
    routerSpy = jasmine.createSpyObj<Router>('Router', [], { url: '/introduction/1234-1234-1234' });
    const logger = new MockLogger();
    const service = new ParticipantStatusUpdateService(apiClientSpy, logger, routerSpy);

    it('should raise participant event with event type not signed in', async () => {
        spyOn(logger, 'error');

        await service.postParticipantStatus(EventType.ParticipantNotSignedIn, '62464424244');
        expect(apiClientSpy.updateParticipantStatus).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledTimes(0);
    });
});

describe('ParticipantStatusUpdateService failure', () => {
    let apiClientSpy: jasmine.SpyObj<ApiClient>;
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', ['updateParticipantStatus']);
    apiClientSpy.updateParticipantStatus.and.throwError('Error');

    let routerSpy: jasmine.SpyObj<Router>;
    routerSpy = jasmine.createSpyObj<Router>('Router', [], { url: '/introduction/1234-1234-1234' });

    const logger = new MockLogger();
    const service = new ParticipantStatusUpdateService(apiClientSpy, logger, routerSpy);

    it('should not raise participant event with event type not signed in', async () => {
        spyOn(logger, 'error');

        await service.postParticipantStatus(EventType.ParticipantNotSignedIn, '3512352531');
        expect(apiClientSpy.updateParticipantStatus).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
    });
});
