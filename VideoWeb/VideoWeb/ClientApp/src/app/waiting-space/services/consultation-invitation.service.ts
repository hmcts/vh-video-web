import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ConsultationAnswer } from 'src/app/services/clients/api-client';

export interface ConsultationInvitation {
    answer: ConsultationAnswer;
    invitationId: string;
    roomLabel: string;
    linkedParticipantStatuses: { [participantId: string]: boolean };
    invitedByName: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConsultationInvitationService {
    private consultationInvitations: BehaviorSubject<ConsultationInvitation[]> = new BehaviorSubject([]);
    consultationInvitations$ = this.consultationInvitations.asObservable();

    get currentInvitations() {
        return this.consultationInvitations.value;
    }

    getInvitation(roomLabel: string): ConsultationInvitation {
        let invitation = this.getInvitationByRoomLabel(roomLabel);

        if (!invitation) {
            invitation = {
                answer: ConsultationAnswer.None,
                invitationId: null,
                roomLabel: roomLabel,
                linkedParticipantStatuses: {},
                activeToast: null,
                activeParticipantAccepted: false,
                invitedByName: null
            } as ConsultationInvitation;
        }

        return invitation;
    }

    rejectInvitation(roomLabel: string) {
        const invitation = this.getInvitationByRoomLabel(roomLabel);
        if (invitation) {
            invitation.answer = ConsultationAnswer.Rejected;
        }
        this.consultationInvitations.next([...this.currentInvitations]);
    }

    linkedParticipantRejectedInvitation(roomLabel: string, linkedParticipantId: string) {
        const invitation = this.getInvitationByRoomLabel(roomLabel);
        if (invitation) {
            invitation.answer = ConsultationAnswer.Rejected;
            invitation.linkedParticipantStatuses[linkedParticipantId] = false;
        }
        this.consultationInvitations.next([...this.currentInvitations]);
    }

    removeInvitation(roomLabel: string) {
        this.consultationInvitations.next([...this.currentInvitations.filter(invitation => invitation.roomLabel !== roomLabel)]);
    }

    removeAllInvitations() {
        this.consultationInvitations.next([]);
    }

    addInvitation(invitation: ConsultationInvitation) {
        if (!this.getInvitationByRoomLabel(invitation.roomLabel)) {
            this.consultationInvitations.next([...this.currentInvitations, invitation]);
        }
    }

    private getInvitationByRoomLabel(roomLabel: string): ConsultationInvitation {
        return this.currentInvitations.find(invitation => invitation.roomLabel === roomLabel);
    }
}
