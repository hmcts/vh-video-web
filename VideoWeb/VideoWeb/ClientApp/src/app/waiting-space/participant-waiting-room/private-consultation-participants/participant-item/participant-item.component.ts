import { Component, Input } from '@angular/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { VHEndpoint, VHParticipant } from '../../../store/models/vh-conference';

@Component({
    selector: 'app-participant-item',
    templateUrl: './participant-item.component.html',
    styleUrls: ['./participant-item.component.scss']
})
export class ParticipantItemComponent {
    @Input() participant: VHParticipant;
    @Input() interpreter: VHParticipant;
    @Input() participantCallStatuses: any = {};
    @Input() roomLabel: string;
    @Input() conferenceId: string;
    @Input() canInvite: boolean;
    @Input() status: string;

    ParticipantStatus = ParticipantStatus;

    getRowClasses(participant: VHParticipant): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return '';
    }

    isParticipantAvailable(participant: VHParticipant | VHEndpoint): boolean {
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(participant.status) >= 0;
    }

    isParticipantInCurrentRoom(roomParticipant: VHParticipant): boolean {
        return roomParticipant.room?.label === this.roomLabel;
    }

    isInterpreterAvailable(): boolean {
        if (!this.interpreter) {
            return true;
        }

        return this.isParticipantAvailable(this.interpreter);
    }

    isProtected(): boolean {
        return this.participantCallStatuses[this.participant.id] === 'Protected';
    }
}
