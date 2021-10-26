import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
import { ParticipantContactDetails } from 'src/app/shared/models/participant-contact-details';
import { ParticipantStatusDirective } from '../vho-shared/participant-status-base/participant-status-base.component';
@Component({
    selector: 'app-admin-im-list',
    templateUrl: './admin-im-list.component.html',
    styleUrls: ['./admin-im-list.component.scss']
})
export class AdminImListComponent extends ParticipantStatusDirective implements OnInit {
    @Input() hearing: Hearing;
    @Output() selectedParticipant = new EventEmitter<ParticipantContactDetails>();

    currentParticipant: ParticipantContactDetails;
    roles = Role;

    ngOnInit() {
        this.conferenceId = this.hearing.getConference().id;
        this.setupEventHubSubscribers();
        this.loadData();
    }

    selectParticipant(participant: ParticipantContactDetails) {
        this.currentParticipant = participant;
        this.selectedParticipant.emit(participant);
    }

    isParticipantAvailable(participant: Participant): boolean {
        if (participant.isJudge) {
            return participant.status !== ParticipantStatus.Disconnected && participant.status !== ParticipantStatus.InConsultation;
        } else {
            return participant.status === ParticipantStatus.Available;
        }
    }
}
