import { Hearing } from './models/hearing';
import { UserProfileResponse, Role } from '../services/clients/api-client';
import { SharedModule } from './shared.module';
import { Injectable } from '@angular/core';
import { InstantMessage } from '../services/models/instant-message';

@Injectable({
    providedIn: SharedModule
})
export class ImHelper {
    isImForUser(message: InstantMessage, hearing: Hearing, profile: UserProfileResponse) {
        if (profile.role === Role.VideoHearingsOfficer) {
            return true;
        }

        const usersInHearing = hearing.participants.map(p => p.username.toLowerCase().trim());
        return usersInHearing.includes(message.to.toLowerCase().trim()) || usersInHearing.includes(message.from.toLowerCase().trim());
    }
}
