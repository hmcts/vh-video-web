import { Injectable } from '@angular/core';
import { Role, UserProfileResponse } from '../services/clients/api-client';
import { InstantMessage } from '../services/models/instant-message';
import { SharedModule } from './shared.module';

@Injectable({
    providedIn: SharedModule
})
export class ImHelper {
    isImForUser(message: InstantMessage, participantUsername: string, loggedInProfile: UserProfileResponse) {
        if (loggedInProfile.role === Role.VideoHearingsOfficer) {
            return this.isParticipantSenderOrRecepient(message, participantUsername);
        } else {
            return this.isParticipantSenderOrRecepient(message, loggedInProfile.username);
        }
    }

    private isParticipantSenderOrRecepient(message: InstantMessage, username: string) {
        const user = username.toLowerCase();
        return user === message.from.toLowerCase() || user === message.to.toLowerCase();
    }
}
