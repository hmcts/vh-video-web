import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ParticipantStatus } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-start-private-consultation',
    templateUrl: './start-private-consultation.component.html',
    styleUrls: ['./start-private-consultation.component.scss']
})
export class StartPrivateConsultationComponent {
    selectedParticipants = Array<string>();
    @Input() participants: Participant[];
    @Output() continue = new EventEmitter<string[]>();
    @Output() cancel = new EventEmitter();

    constructor(protected logger: Logger) {}

    participantSelected(id: string): boolean {
        const index = this.selectedParticipants.indexOf(id);
        return index >= 0;
    }

    toggleParticipant(id: string) {
        const index = this.selectedParticipants.indexOf(id);
        if (index >= 0) {
            this.selectedParticipants.splice(index, 1);
        } else {
            this.selectedParticipants.push(id);
        }
    }

    onContinue() {
        this.continue.emit(this.selectedParticipants);
    }

    onCancel() {
        this.cancel.emit();
    }

    getParticipantDisabled(participant): boolean {
        return participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation;
    }
    getParticipantStatusCss(participant: Participant): string {
        if (participant.status !== ParticipantStatus.Available && participant.status !== ParticipantStatus.InConsultation) {
            return 'unavailable';
        } else if (participant.status === ParticipantStatus.InConsultation) {
            return 'in-consultation';
        }
    }

    getShouldDisplayLabel(participant: Participant): boolean {
        return this.getParticipantDisabled(participant) || participant.status === ParticipantStatus.InConsultation;
    }

    getParticipantStatus(participant: Participant): string {
        if (this.getParticipantDisabled(participant)) {
            return 'Unavailable';
        }

        if (participant.status === ParticipantStatus.InConsultation && participant.base.current_room != null) {
            return (
                'In ' +
                this.camelToSpaced(
                    participant.base.current_room.label.replace('ParticipantConsultationRoom', 'MeetingRoom')
                ).toLowerCase() +
                (participant.base.current_room.locked ? ' LockedIcon' : '')
            );
        }
        return;
    }

    protected camelToSpaced(word: string) {
        const splitWord = word
            .match(/[a-z]+|[^a-z]+/gi)
            .join(' ')
            .split(/(?=[A-Z])/)
            .join(' ');
        const lowcaseWord = splitWord.toLowerCase();
        return lowcaseWord.charAt(0).toUpperCase() + lowcaseWord.slice(1);
    }
}
