import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from 'events';

@Component({ selector: 'app-confirmation-popup', template: '' })
export class ConfirmationPopupStubComponent {
    @Input()
    message = '';
    @Output()
    ok = new EventEmitter();
}
