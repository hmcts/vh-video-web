import { Injectable } from '@angular/core';
import { Participant } from 'src/app/shared/models/participant';
import { Logger } from 'src/app/services/logging/logger-base';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class NotificationToastrService {
    private readonly loggerPrefix = '[NotificationToastService] -';
    constructor(private logger: Logger, private toastr: ToastrService) {}
    
    ShowConsultationInvite(roomLabel: string, conferenceId: string, requestedBy: Participant, requestedFor: Participant, participants: Participant[]) {
        this.logger.debug(`${this.loggerPrefix} creating 'ShowConsultationInvite' toastr notification`);
        let message = `<span class="govuk-!-font-weight-bold">Call from ${requestedBy.displayName}</span>`
        var participantsList = participants.filter(p => p.id != requestedBy.id).map(p => p.displayName).join('\n');
        if (participantsList) {
            participantsList = `with\n${participantsList}`
            message += `\nwith\n${participantsList}`
        }
        this.toastr.show(message, 'Title');
    }
}
