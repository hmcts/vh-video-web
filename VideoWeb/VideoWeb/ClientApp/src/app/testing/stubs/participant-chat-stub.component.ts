import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';
@Component({
    standalone: false, selector: 'app-participant-chat', template: '' })
export class ParticipantChatStubComponent {
    @Input()
    hearing: Hearing;
}
