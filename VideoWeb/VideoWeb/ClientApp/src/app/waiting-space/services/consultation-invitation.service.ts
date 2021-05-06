import { Injectable } from '@angular/core';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

export interface ConsultationInvitation {
    answer: ConsultationAnswer;
    invitationId: string;
    roomLabel: string;
    linkedParticipantStatuses: { [participantId: string]: boolean };
    activeToast: VhToastComponent;
    invitedByName: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConsultationInvitationService {
    private consultationInvitations: { [roomLabel: string]: ConsultationInvitation } = {};

    getInvitation(roomLabel: string): ConsultationInvitation {
        const invitation = this.consultationInvitations[roomLabel];

        if (!invitation || invitation.answer === ConsultationAnswer.Rejected) {
            this.consultationInvitations[roomLabel] = {
                answer: ConsultationAnswer.None,
                invitationId: null,
                roomLabel: roomLabel,
                linkedParticipantStatuses: {},
                activeToast: null,
                activeParticipantAccepted: false,
                invitedByName: null
            } as ConsultationInvitation;

            return this.consultationInvitations[roomLabel];
        }

        return invitation;
    }

    rejectInvitation(roomLabel: string) {
        const invitation = this.consultationInvitations[roomLabel];
        if (invitation) {
            invitation.answer = ConsultationAnswer.Rejected;
        }
    }

    removeInvitation(roomLabel: string) {
        if (this.consultationInvitations[roomLabel]?.activeToast) {
            this.consultationInvitations[roomLabel].activeToast.remove();
            this.consultationInvitations[roomLabel].activeToast = null;
        }

        delete this.consultationInvitations[roomLabel];
    }
}
