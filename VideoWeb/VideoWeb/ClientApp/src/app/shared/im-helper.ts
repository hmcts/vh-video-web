import { Injectable } from '@angular/core';
import { CurrentUserOrParticipantResponse, Role } from '../services/clients/api-client';
import { InstantMessage } from '../services/models/instant-message';
import { SharedModule } from './shared.module';

@Injectable({
    providedIn: SharedModule
})
export class ImHelper {
    isImForUser(message: InstantMessage, participantId: string, loggedInProfile: CurrentUserOrParticipantResponse) {
        if (loggedInProfile.role === Role.VideoHearingsOfficer) {
            return this.isParticipantSenderOrRecepient(message, participantId);
        } else {
            return this.isParticipantSenderOrRecepient(message, loggedInProfile.participant_id ?? loggedInProfile.admin_username);
        }
    }

    private isParticipantSenderOrRecepient(message: InstantMessage, participantId: string) {
        return participantId === message.from || participantId === message.to;
    }
}
