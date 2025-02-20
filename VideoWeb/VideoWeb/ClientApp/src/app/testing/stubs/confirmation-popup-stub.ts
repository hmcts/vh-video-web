import { Component, Input, Output } from '@angular/core';
import { EventEmitter } from 'events';

@Component({
    standalone: false,
    selector: 'app-confirmation-popup',
    template: ''
})
export class ConfirmationPopupStubComponent {
    @Input()
    message = '';
    @Output()
    ok = new EventEmitter();
}
