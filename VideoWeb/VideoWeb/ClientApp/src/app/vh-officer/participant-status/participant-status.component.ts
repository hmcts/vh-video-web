import { Component, Input, OnInit } from '@angular/core';
import { ParticipantStatusDirective } from '../vho-shared/participant-status-base/participant-status-base.component';
import { UpdateParticipantDisplayNameRequest } from '../../services/clients/api-client';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';

@Component({
    selector: 'app-participant-status',
    templateUrl: './participant-status.component.html',
    styleUrls: ['./participant-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantStatusComponent extends ParticipantStatusDirective implements OnInit {
    @Input() conferenceId: string;
    participantBeingEdited: ParticipantContactDetails;
    newParticipantName: string;
    editIcon = faPenToSquare;
    showError = false;

    ngOnInit() {
        this.participantBeingEdited = null;
        this.newParticipantName = null;
        this.setupEventHubSubscribers();
        this.loadData();
    }

    isEditingParticipant(id: string) {
        return this.participantBeingEdited?.id === id;
    }

    setParticipantEdit(participant: ParticipantContactDetails) {
        this.participantBeingEdited = participant;
        this.newParticipantName = participant.displayName;
    }

    onParticipantNameChange(value: string) {
        this.newParticipantName = value;
    }

    cancelNameUpdate() {
        this.participantBeingEdited = null;
        this.newParticipantName = null;
        this.showError = false;
    }

    saveNameUpdate(participantId: string) {
        const updatedParticipant = new UpdateParticipantDisplayNameRequest({ display_name: this.newParticipantName });
        this.videoWebService
            .updateParticipantDisplayName(this.conferenceId, participantId, updatedParticipant)
            .then(() => {
                this.showError = false;
                this.cancelNameUpdate();
            })
            .catch(error => {
                this.showError = true;
                this.logger.error('Failed to update display-name', error);
            });
    }
}
