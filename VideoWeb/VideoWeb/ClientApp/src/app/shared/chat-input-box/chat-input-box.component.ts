import { Component, OnInit, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, Input } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-chat-input-box',
    templateUrl: './chat-input-box.component.html',
    styleUrls: ['./chat-input-box.component.scss']
})
export class ChatInputBoxComponent implements OnInit, AfterViewInit {
    maxInputLength = 256;
    newMessageBody: FormControl;
    screenReaderAlert: HTMLElement;
    @Input() useLightText: boolean = false;
    @Output() submittedMessage = new EventEmitter<string>();
    @ViewChild('screenReaderInputLimitAlert') screenReaderInputLimitAlert: ElementRef;
    constructor(private translateService: TranslateService) {}

    ngOnInit() {
        this.initForm();
    }

    ngAfterViewInit() {
        this.screenReaderAlert = this.screenReaderInputLimitAlert.nativeElement;
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

    onKeyup(event: KeyboardEvent) {
        this.toggleInputAlertForScreenReaders(event);
    }

    toggleInputAlertForScreenReaders(event: KeyboardEvent) {
        if (this.currentInputLength < this.maxInputLength) {
            this.hideInputAlertForScreenReaders();
            return;
        }

        if (event.key === 'Delete' || event.key === 'Backspace') {
            this.hideInputAlertForScreenReaders();
            return;
        }

        this.showInputAlertForScreenReaders();
    }

    hideInputAlertForScreenReaders() {
        if (this.screenReaderAlert.textContent !== '') {
            this.screenReaderAlert.textContent = '';
        }
    }

    showInputAlertForScreenReaders() {
        // Update the DOM to trigger the aria alert for screen readers
        // See https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alert_role#example_3_visually_hidden_alert_container_for_screen_reader_notifications
        this.screenReaderAlert.textContent = '';
        this.screenReaderAlert.textContent = this.translateService.instant('chat-input-box.maximum-characters-entered');
    }
}
