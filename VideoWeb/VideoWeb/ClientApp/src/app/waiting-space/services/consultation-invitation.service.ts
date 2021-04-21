import { Injectable } from '@angular/core';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

export class ConsultationInvitation {
    private _linkedParticipantStatuses:  { [participantId: string]: boolean };
    constructor(linkedParticipantStatuses: { [participantId: string]: boolean } = {}, public activeToast: VhToastComponent = null, public activeParticipantAccepted: boolean = false) {
        this._linkedParticipantStatuses = linkedParticipantStatuses;
    }

    get linkedParticipantStatuses(): { [participantId: string]: boolean } {
        return this._linkedParticipantStatuses;
    }

    addLinkedParticipant(participantId: string) {
        if (this._linkedParticipantStatuses[participantId] === undefined) {
            this._linkedParticipantStatuses[participantId] = false;
        }
    }

    updateLinkedParticipantStatus(participantId: string, accepted: boolean) {
        this._linkedParticipantStatuses[participantId] = accepted;
    }
}

@Injectable({
  providedIn: 'root'
})
export class ConsultationInvitationService {
    private consultationInvitations:  { [roomLabel: string]: ConsultationInvitation } = {};

    constructor() { }

    createInvitation(roomLabel: string): ConsultationInvitation {
        const invitation = this.consultationInvitations[roomLabel] = new ConsultationInvitation();
        return invitation;
    }

    getInvitation(roomLabel: string): ConsultationInvitation {
        if (!this.consultationInvitations[roomLabel]) {
            return this.createInvitation(roomLabel);
        }

        return this.consultationInvitations[roomLabel];
    }

    removeInvitation(roomLabel: string) {
        if (this.consultationInvitations[roomLabel]?.activeToast) {
            this.consultationInvitations[roomLabel].activeToast.remove();
            this.consultationInvitations[roomLabel].activeToast = null;
        }
        delete this.consultationInvitations[roomLabel];
    }
}
