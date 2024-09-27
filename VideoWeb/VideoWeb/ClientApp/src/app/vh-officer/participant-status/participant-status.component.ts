import {Component, Input, OnInit} from '@angular/core';
import {ParticipantStatusDirective} from '../vho-shared/participant-status-base/participant-status-base.component';
import {UpdateParticipantDisplayNameRequest} from '../../services/clients/api-client';
import {faPenToSquare} from '@fortawesome/free-solid-svg-icons';
import {ParticipantContactDetails} from '../../shared/models/participant-contact-details';

@Component({
    selector: 'app-participant-status',
    templateUrl: './participant-status.component.html',
    styleUrls: ['./participant-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantStatusComponent extends ParticipantStatusDirective implements OnInit {
    @Input() conferenceId: string;
    participantBeingEdited: ParticipantContactDetails;
    newParticipantDisplayName: string;
    editIcon = faPenToSquare;

    ngOnInit() {
        this.participantBeingEdited = null;
        this.newParticipantDisplayName = null;
        this.setupEventHubSubscribers();
        this.loadData();
    }

    isEditingParticipant(id: string) {
        return this.participantBeingEdited?.id === id;
    }

    setParticipantEdit(participant: ParticipantContactDetails) {
        this.participantBeingEdited = participant;
        this.newParticipantDisplayName = participant.displayName;
    }

    onParticipantDisplayName(value: string) {
        this.newParticipantDisplayName = value;
    }

    cancelDisplayName() {
        this.participantBeingEdited = null;
        this.newParticipantDisplayName = null;
    }

    async renameParticipant(participantId: string) {
        const updatedParticipant = new UpdateParticipantDisplayNameRequest({ display_name: this.newParticipantDisplayName });
        await this.videoWebService.updateParticipantDisplayName(this.conferenceId, participantId, updatedParticipant);
        this.cancelDisplayName();
    }
}
