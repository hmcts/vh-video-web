import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';
@Component({
    selector: 'app-admin-im-list',
    templateUrl: './admin-im-list.component.html',
    styleUrls: ['./admin-im-list.component.scss']
})
export class AdminImListComponent implements OnInit {
    @Input() hearing: Hearing;
    @Output() selectedParticipant = new EventEmitter<Participant>();
    imParticipants: Participant[];

    currentParticipant: Participant;

    roles = Role;
    participantStatus = ParticipantStatus;
    constructor() {}

    ngOnInit() {
        this.initImParticipants(false);
    }

    initImParticipants(onlyJudge: boolean) {
        this.imParticipants = [this.hearing.judge];
        if (!onlyJudge) {
            const nonJudge = this.hearing.participants.filter(p => p.role !== Role.Judge);
            this.imParticipants = this.imParticipants.concat(nonJudge);
        }
    }

    selectParticipant(participant: Participant) {
        this.currentParticipant = participant;
        this.selectedParticipant.emit(participant);
    }
}
