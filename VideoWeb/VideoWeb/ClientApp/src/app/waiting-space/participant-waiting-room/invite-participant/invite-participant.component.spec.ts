import { InviteParticipantComponent } from './invite-participant.component';
import { consultationService } from '../../waiting-room-shared/tests/waiting-room-base-setup';
import { fakeAsync, flushMicrotasks } from '@angular/core/testing';

describe('InviteParticipantComponent', () => {
    let component: InviteParticipantComponent;
    beforeEach(() => {
        component = new InviteParticipantComponent(consultationService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call consultation service when a participant is invited', fakeAsync(() => {
        // Arrange
        component.participantId = 'ParticipantId';

        // Act
        component.inviteParticipant();
        flushMicrotasks();

        // Assert
        expect(consultationService.inviteToConsultation).toHaveBeenCalledTimes(1);
    }));

    it('should call consultation service when a participant is invited', fakeAsync(() => {
        // Arrange
        component.endpointId = 'EndpointId';

        // Act
        component.inviteParticipant();
        flushMicrotasks();

        // Assert
        expect(consultationService.addEndpointToConsultation).toHaveBeenCalledTimes(1);
    }));
});
