import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    selector: 'app-admin-im',
    templateUrl: './admin-im.component.html',
    styleUrls: ['../vho-global-styles.scss']
})
export class AdminImComponent {
    @Input() hearing: Hearing;

    currentParticipant: Participant;
    constructor() {}

    onParticipantSelected(participant: Participant) {
        this.currentParticipant = participant;
    }
}
