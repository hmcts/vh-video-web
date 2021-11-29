import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer, ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-participant-item',
    templateUrl: './participant-item.component.html',
    styleUrls: ['./participant-item.component.scss']
})
export class ParticipantItemComponent {
    ParticipantStatus = ParticipantStatus;
    @Input() participant: ParticipantResponse;
    @Input() interpreter: ParticipantResponse;
    @Input() participantCallStatuses: any = {};
    @Input() roomLabel: string;
    @Input() conferenceId: string;
    @Input() canInvite: boolean;

    constructor() {}
    getRowClasses(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return '';
    }

    isParticipantAvailable(participant: any): boolean {
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(participant.status) >= 0;
    }

    participantNameClass(roomParticipant: any): string {
        if (this.isParticipantInCurrentRoom(roomParticipant)) {
            return 'yellow';
        }

        return this.isParticipantAvailable(roomParticipant) ? 'white' : '';
    }

    isParticipantInCurrentRoom(roomParticipant: any): boolean {
        return roomParticipant.current_room?.label === this.roomLabel;
    }
}
