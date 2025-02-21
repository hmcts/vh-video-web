import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';
import { Participant } from 'src/app/shared/models/participant';

@Component({
    standalone: false,
    selector: 'app-admin-im',
    templateUrl: './admin-im.component.html',
    styleUrls: ['./admin-im.component.scss', '../vho-global-styles.scss']
})
export class AdminImComponent {
    @Input() hearing: Hearing;

    currentParticipant: Participant;
    constructor() {}

    onParticipantSelected(participant: Participant) {
        this.currentParticipant = participant;
    }
}
