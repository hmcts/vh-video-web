import { Component, Input } from '@angular/core';
import { ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';

@Component({
    selector: 'app-participant-item',
    templateUrl: './participant-item.component.html',
    styleUrls: ['./participant-item.component.scss']
})
export class ParticipantItemComponent {
    @Input() participant: ParticipantResponse;
    @Input() interpreter: ParticipantResponse;
    @Input() participantCallStatuses: any = {};
    @Input() roomLabel: string;
    @Input() conferenceId: string;
    @Input() canInvite: boolean;
    @Input() status: string;

    ParticipantStatus = ParticipantStatus;

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

    isParticipantInCurrentRoom(roomParticipant: any): boolean {
        return roomParticipant.current_room?.label === this.roomLabel;
    }

    isInterpreterAvailable(): boolean {
        if (!this.interpreter) {
            return true;
        }

        return this.isParticipantAvailable(this.interpreter);
    }
}
