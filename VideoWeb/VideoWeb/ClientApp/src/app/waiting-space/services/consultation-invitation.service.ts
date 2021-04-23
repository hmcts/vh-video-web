import { Injectable } from '@angular/core';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

export interface ConsultationInvitation {
    linkedParticipantStatuses: { [participantId: string]: boolean };
    activeToast: VhToastComponent;
    activeParticipantAccepted: boolean;
    invitedByName: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConsultationInvitationService {
    private consultationInvitations: { [roomLabel: string]: ConsultationInvitation } = {};

    getInvitation(roomLabel: string): ConsultationInvitation {
        return (this.consultationInvitations[roomLabel] =
            this.consultationInvitations[roomLabel] ??
            ({
                linkedParticipantStatuses: {},
                activeToast: null,
                activeParticipantAccepted: false,
                invitedByName: null
            } as ConsultationInvitation));
    }

    removeInvitation(roomLabel: string) {
        if (this.consultationInvitations[roomLabel]?.activeToast) {
            this.consultationInvitations[roomLabel].activeToast.remove();
            this.consultationInvitations[roomLabel].activeToast = null;
        }
        delete this.consultationInvitations[roomLabel];
    }
}
