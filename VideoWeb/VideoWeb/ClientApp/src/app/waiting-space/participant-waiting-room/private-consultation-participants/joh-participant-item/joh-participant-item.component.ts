import { Component, Input} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConsultationService } from 'src/app/services/api/consultation.service';
import { ConsultationAnswer, ParticipantResponse, ParticipantStatus } from 'src/app/services/clients/api-client';


@Component({
    selector: 'app-joh-participant-item',
    templateUrl: './joh-participant-item.component.html',
    styleUrls: ['./joh-participant-item.component.scss']
})
export class JohParticipantItemComponent {
    @Input() participant: ParticipantResponse;
    @Input() participantCallStatuses: any;
    @Input() roomLabel: string;
    @Input() conferenceId: string;
    @Input() canInvite: boolean;
   
    constructor(private translateService: TranslateService , private consultationService: ConsultationService  ) {
        
    }

    getRowClasses(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return '';
    }

    
    getParticipantStatus(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return '';
        }
        if (this.participantCallStatuses[participant.id] === 'Calling') {
            return this.translateService.instant('private-consultation-participants.calling');
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Rejected) {
            return this.translateService.instant('private-consultation-participants.declined');
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Failed) {
            return this.translateService.instant('private-consultation-participants.failed');
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.None) {
            return this.translateService.instant('private-consultation-participants.no-answer');
        }
        if (
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Transferring ||
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Accepted
        ) {
            return this.translateService.instant('private-consultation-participants.transferring');
        }
        if (participant.current_room?.label) {
            return (
                this.consultationService.consultationNameToString(participant.current_room?.label, true) +
                (participant.current_room?.locked ? ' <span class="fas fa-lock-alt"></span>' : '')
            );
        }

        if (!this.isParticipantAvailable(participant)) {
            return this.translateService.instant('private-consultation-participants.not-available');
        }
    }

    isParticipantAvailable(participant: any): boolean {
        const availableStatuses = ['Available', 'Connected', 'InConsultation'];
        return availableStatuses.indexOf(participant.status) >= 0;
    }

    participantNameClass(participant: any): string {
        if (this.isParticipantInCurrentRoom(participant)) {
            return 'yellow';
        }

        return this.isParticipantAvailable(participant) ? 'white' : '';
    }

    isParticipantInCurrentRoom(participant: any): boolean {
        return participant.current_room?.label === this.roomLabel;
    }

    getParticipantStatusClasses(participant: ParticipantResponse): string {
        if (this.participantCallStatuses[participant.id] === 'Calling') {
            return 'yellow';
        }
        if (
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Transferring ||
            this.participantCallStatuses[participant.id] === ConsultationAnswer.Accepted
        ) {
            return 'yellow';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Rejected) {
            return 'red';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.Failed) {
            return 'red';
        }
        if (this.participantCallStatuses[participant.id] === ConsultationAnswer.None) {
            return 'red';
        }
        if (participant.status === ParticipantStatus.InConsultation && !this.isParticipantInCurrentRoom(participant)) {
            return 'outline';
        }
        return 'white';
    }   
}
