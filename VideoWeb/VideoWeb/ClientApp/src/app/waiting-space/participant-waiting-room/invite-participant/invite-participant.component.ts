import { Component, Input } from '@angular/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';

@Component({
    selector: 'app-invite-participant',
    templateUrl: './invite-participant.component.html',
    styleUrls: ['./invite-participant.component.scss']
})
export class InviteParticipantComponent {
    @Input() participantId: string;
    @Input() conferenceId: string;
    @Input() roomLabel: string;

    tooltip: string;

    constructor(private consultationService: ConsultationService) {
    }

    inviteParticipant() {
        this.consultationService.inviteToConsulation(this.conferenceId, this.roomLabel, this.participantId);
    }
}
