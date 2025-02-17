import { EventEmitter, Component, Output } from '@angular/core';

@Component({
    standalone: false, selector: 'app-chat-input-box', template: '' })
export class ChatInputBoxStubComponent {
    @Output() submittedMessage = new EventEmitter<string>();
}
