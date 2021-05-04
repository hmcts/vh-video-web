import { Injectable } from '@angular/core';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

export interface ConsultationInvitation {
    invitationId: string,
    roomLabel: string,
    linkedParticipantStatuses: { [participantId: string]: boolean };
    activeToast: VhToastComponent;
    activeParticipantAccepted: boolean;
    invitedByName: string;
    rejected: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ConsultationInvitationService {
    private consultationInvitations: { [roomLabel: string]: ConsultationInvitation } = {};

    getInvitation(roomLabel: string): ConsultationInvitation {
        const invitation = this.consultationInvitations[roomLabel];

        if (!invitation || invitation.rejected) {
            return (this.consultationInvitations[roomLabel] = {
                invitationId: null,
                roomLabel: roomLabel,
                linkedParticipantStatuses: {},
                activeToast: null,
                activeParticipantAccepted: false,
                invitedByName: null,
                rejected: false
            } as ConsultationInvitation);
        }

        return invitation;
    }

    rejectInvitation(roomLabel: string) {
        const invitation = this.consultationInvitations[roomLabel];
        if (invitation) {
            invitation.rejected = true;
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
