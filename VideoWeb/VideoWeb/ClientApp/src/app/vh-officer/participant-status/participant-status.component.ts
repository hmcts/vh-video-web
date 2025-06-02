import { Component, Input, OnInit } from '@angular/core';
import { ParticipantStatusDirective } from '../vho-shared/participant-status-base/participant-status-base.component';
import { ParticipantStatus, Role, UpdateParticipantDisplayNameRequest } from '../../services/clients/api-client';
import { faPenToSquare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ParticipantContactDetails } from '../../shared/models/participant-contact-details';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ErrorService } from 'src/app/services/error.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantStatusReader } from 'src/app/shared/models/participant-status-reader';
import { EndpointDetails } from 'src/app/shared/models/endpoint-details';

@Component({
    standalone: false,
    selector: 'app-participant-status',
    templateUrl: './participant-status.component.html',
    styleUrls: ['./participant-status.component.scss', '../vho-global-styles.scss']
})
export class ParticipantStatusComponent extends ParticipantStatusDirective implements OnInit {
    @Input() conferenceId: string;
    participantBeingEdited: ParticipantContactDetails;
    endpointBeingEdited: EndpointDetails;
    newParticipantName: string;
    newEndpointName: string;
    editIcon = faPenToSquare;
    deleteIcon = faTrash;
    showError = false;

    constructor(
        protected videoWebService: VideoWebService,
        protected errorService: ErrorService,
        protected eventService: EventsService,
        protected logger: Logger,
        protected participantStatusReader: ParticipantStatusReader
    ) {
        super(videoWebService, errorService, eventService, logger, participantStatusReader);
    }

    ngOnInit() {
        this.participantBeingEdited = null;
        this.newParticipantName = null;
        this.setupEventHubSubscribers();
        this.loadData();
        this.loadEndpointData();
    }

    isEditingParticipant(id: string) {
        return this.participantBeingEdited?.id === id;
    }
    isEditingEndpoint(id: string) {
        return this.participantBeingEdited?.id === id;
    }

    setParticipantEdit(participant: ParticipantContactDetails) {
        this.participantBeingEdited = participant;
        this.newParticipantName = participant.displayName;
    }

    onParticipantNameChange(value: string) {
        this.newParticipantName = value;
    }
    onEndpointNameChange(value: string) {
        this.newEndpointName = value;
    }

    /**
     * The function `cancelNameUpdate` resets the participant being edited, new participant name, and
     * error status.
     */
    cancelNameUpdate() {
        this.participantBeingEdited = null;
        this.newParticipantName = null;
        this.showError = false;
    }

    /**
     * The `saveNameUpdate` function updates the display name of a participant in a video conference.
     * @param {string} participantId - The `participantId` parameter is a string that represents the
     * unique identifier of the participant whose display name is being updated.
     */
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

    /**
     * The `deleteParticipant` function deletes a participant from a video conference using the
     * participant's ID.
     * @param participant - The `participant` parameter is an object representing a participant in a
     * conference. It likely contains information such as the participant's ID, name, role, and other
     * relevant details.
     */
    deleteParticipant(participant) {
        this.videoWebService.deleteParticipant(this.conferenceId, participant.id).catch(error => {
            this.logger.error('Failed to delete participant', error);
        });
    }

    /**
     * The function checks if a participant with a specific role and status can be deleted.
     * @param participant - The `participant` parameter represents an individual who is part of a
     * certain system or platform. This individual has properties such as `role` and `status` which
     * determine their permissions and current state within the system. The function
     * `isParticipantDeletable` checks if a participant is eligible for deletion based
     * @returns The function is checking if a participant is deletable based on their role and status.
     * It will return true if the participant's role is either QuickLinkParticipant or
     * QuickLinkObserver and their status is Disconnected.
     */
    isParticipantDeletable(participant) {
        return (
            (participant.role === Role.QuickLinkParticipant || participant.role === Role.QuickLinkObserver) &&
            participant.status === ParticipantStatus.Disconnected
        );
    }
}
