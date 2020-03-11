import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from 'events';

@Component({ selector: 'app-cancel-popup', template: '' })
export class CancelPopupStubComponent {
    @Input()
    message = '';
    @Output()
    continueBooking = new EventEmitter();
    @Output()
    cancelBooking = new EventEmitter();
}
