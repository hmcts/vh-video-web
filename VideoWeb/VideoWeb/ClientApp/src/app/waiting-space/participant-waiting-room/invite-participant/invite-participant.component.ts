import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-invite-participant',
    templateUrl: './invite-participant.component.html',
    styleUrls: ['./invite-participant.component.scss']
})
export class InviteParticipantComponent implements OnInit {
    @Input() participantId: string;
    tooltip: string;

    constructor() {}

    ngOnInit(): void {
    }

    inviteParticipant() {
        //this.clipboardService.copyFromContent(text);
    }
}
