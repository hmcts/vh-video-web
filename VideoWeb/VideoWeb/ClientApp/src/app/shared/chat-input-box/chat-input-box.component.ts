import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';

@Component({
    selector: 'app-chat-input-box',
    templateUrl: './chat-input-box.component.html',
    styleUrls: ['./chat-input-box.component.scss']
})
export class ChatInputBoxComponent implements OnInit {
    maxInputLength = 256;
    newMessageBody: FormControl;
    @Output() submittedMessage = new EventEmitter<string>();
    constructor() {}

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        this.newMessageBody = new FormControl(null, [Validators.minLength(1), Validators.maxLength(this.maxInputLength)]);
    }

    get currentInputLength(): number {
        if (this.newMessageBody.value) {
            return this.newMessageBody.value.length;
        } else {
            return 0;
        }
    }

    get isSendingBlocked(): boolean {
        return this.isInputInvalid || this.currentInputLength === 0;
    }

    get isInputInvalid(): boolean {
        return this.newMessageBody.dirty && this.newMessageBody.hasError('maxlength');
    }

    sendMessage() {
        if (this.newMessageBody.invalid) {
            return;
        }
        const messageBody = this.newMessageBody.value;
        this.newMessageBody.reset();
        this.submittedMessage.emit(messageBody);
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && !event.altKey && !event.shiftKey && !event.ctrlKey) {
            event.stopPropagation();
            event.preventDefault();
            this.sendMessage();
        }
    }
}
