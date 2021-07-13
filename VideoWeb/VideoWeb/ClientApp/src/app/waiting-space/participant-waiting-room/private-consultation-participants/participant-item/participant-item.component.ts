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
    @Input() participant: ParticipantResponse;
    @Input() interpreter: ParticipantResponse;
    @Input() participantCallStatuses: any = {};
    @Input() roomLabel: string;
    @Input() conferenceId: string;
    @Input() canInvite: boolean;

    constructor(private translateService: TranslateService, private consultationService: ConsultationService) {}

    getRowClasses(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return '';
    }

    getParticipantStatus(roomParticipant: any): string {
        if (this.isParticipantInCurrentRoom(roomParticipant)) {
            return '';
        }
        if (this.participantCallStatuses[roomParticipant.id] === 'Calling') {
            return this.translateService.instant('private-consultation-participants.calling');
        }
        if (this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Rejected) {
            return this.translateService.instant('private-consultation-participants.declined');
        }
        if (this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Failed) {
            return this.translateService.instant('private-consultation-participants.failed');
        }
        if (this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.None) {
            return this.translateService.instant('private-consultation-participants.no-answer');
        }
        if (
            this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Transferring ||
            this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Accepted
        ) {
            return this.translateService.instant('private-consultation-participants.transferring');
        }
        if (roomParticipant.current_room?.label) {
            return (
                this.consultationService.consultationNameToString(roomParticipant.current_room?.label, true) +
                (roomParticipant.current_room?.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }

        if (!this.isParticipantAvailable(roomParticipant)) {
            return this.translateService.instant('private-consultation-participants.not-available');
        }
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

    getParticipantStatusClasses(roomParticipant: ParticipantResponse): string {
        if (this.participantCallStatuses[roomParticipant.id] === 'Calling') {
            return 'yellow';
        }
        if (
            this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Transferring ||
            this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Accepted
        ) {
            return 'yellow';
        }
        if (this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Rejected) {
            return 'red';
        }
        if (this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.Failed) {
            return 'red';
        }
        if (this.participantCallStatuses[roomParticipant.id] === ConsultationAnswer.None) {
            return 'red';
        }
        if (roomParticipant.status === ParticipantStatus.InConsultation && !this.isParticipantInCurrentRoom(roomParticipant)) {
            return 'outline';
        }
        return 'white';
    }
}
