import { HeartbeatHealth, ParticipantHeartbeat } from 'src/app/services/models/participant-heartbeat';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { eventsServiceSpy, heartbeatSubjectMock } from 'src/app/testing/mocks/mock-events-service';
import { ParticipantNetworkPoorAlertComponent } from '../participant-network-poor-alert.component';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { NotificationToastrService } from '../../services/notification-toastr.service';

describe('ParticipantNetworkPoorAlertComponent', () => {
    let component: ParticipantNetworkPoorAlertComponent;
    const globalConference = new ConferenceTestData().getConferenceDetailNow();
    const globalParticipant = globalConference.participants[0];
    const eventsService = eventsServiceSpy;
    const heartbeatSubject = heartbeatSubjectMock;
    let notificationToastrService: jasmine.SpyObj<NotificationToastrService>;
    beforeAll(() => {
        notificationToastrService = jasmine.createSpyObj<NotificationToastrService>('NotificationToastrService', ['reportPoorConnection']);
    });

    beforeEach(() => {
        component = new ParticipantNetworkPoorAlertComponent(eventsService, notificationToastrService);
        globalParticipant.status = ParticipantStatus.InConsultation;
        component.participant = globalParticipant;
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should show alert if network connection is poor and participant is in consultation', () => {
        const payload = new ParticipantHeartbeat(
            globalConference.id,
            globalParticipant.id,
            HeartbeatHealth.Poor,
            'Chrome',
            '82.0.0',
            'Mac OS X',
            '10.15.1'
        );
        heartbeatSubject.next(payload);
        component.handleHeartbeat(payload);
        expect(notificationToastrService.reportPoorConnection).toHaveBeenCalled();
    });
});
