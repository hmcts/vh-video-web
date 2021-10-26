import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ConferenceResponseVho, ParticipantContactDetailsResponseVho, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { ErrorService } from 'src/app/services/error.service';
import { Hearing } from 'src/app/shared/models/hearing';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy } from 'src/app/testing/mocks/mock-events-service';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { AdminImListComponent } from './admin-im-list.component';

describe('AdminImListComponent', () => {
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let errorServiceSpy: jasmine.SpyObj<ErrorService>;
    const eventsService = eventsServiceSpy;
    let participantStatusReaderSpy: jasmine.SpyObj<ParticipantStatusReader>;
    let participants: ParticipantContactDetailsResponseVho[];
    let component: AdminImListComponent;
    let conference: ConferenceResponseVho;
    let hearing: Hearing;

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

    beforeEach(() => {
        participants = new ConferenceTestData().getListOParticipantContactDetailsResponseVho(
            '174DFEFB-8EF2-4093-801D-621DF852021D',
            'MyVenue'
        );
        videoWebServiceSpy.getParticipantsWithContactDetailsByConferenceId.and.returnValue(Promise.resolve(participants));

        component = new AdminImListComponent(
            videoWebServiceSpy,
            errorServiceSpy,
            eventsService,
            new MockLogger(),
            participantStatusReaderSpy
        );
        conference = new ConferenceTestData().getConferenceDetailNow();
        hearing = new Hearing(conference);
        component.hearing = hearing;
    });

    it('should initalise data', fakeAsync(() => {
        component.ngOnInit();
        flushMicrotasks();
        expect(component.participants).not.toBeNull();
        expect(component.participants.length).toBe(4);
        expect(component.loadingData).toBeFalsy();
    }));
});
