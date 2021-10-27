import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';

export let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
export const eventsService = eventsServiceSpy;
export let errorServiceSpy: jasmine.SpyObj<ErrorService>;
export let logger: jasmine.SpyObj<Logger>;
export let participantStatusReaderSpy: jasmine.SpyObj<ParticipantStatusReader>;

export function initAllParticipantStatusDependencies() {
    videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', [
        'getParticipantsWithContactDetailsByConferenceId',
        'raiseSelfTestFailureEvent'
    ]);
    errorServiceSpy = jasmine.createSpyObj<ErrorService>('ErrorService', [
        'goToServiceError',
        'handleApiError',
        'returnHomeIfUnauthorised'
    ]);

    participantStatusReaderSpy = jasmine.createSpyObj<ParticipantStatusReader>(
        'ParticipantStatusReader',
        ['getStatusAsText', 'getStatusAsTextForHost'],
        { inAnotherHearingText: 'In Another Hearing' }
    );

    logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'warn', 'event', 'error']);
}
