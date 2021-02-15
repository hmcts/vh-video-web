import { InviteParticipantComponent } from './invite-participant.component';
import { consultationServiceSpyFactory } from 'src/app/testing/mocks/mock-consultation-service';

describe('InviteParticipantComponent', () => {
    let component: InviteParticipantComponent;

    beforeEach(() => {
        const consultationService = consultationServiceSpyFactory();
        component = new InviteParticipantComponent(consultationService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
