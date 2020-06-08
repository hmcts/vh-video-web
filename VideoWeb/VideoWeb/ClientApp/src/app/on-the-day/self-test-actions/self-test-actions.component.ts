import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-self-test-actions',
    templateUrl: './self-test-actions.component.html'
})
export class SelfTestActionsComponent {
    @Output() equipmentWorked = new EventEmitter();
    @Output() equipmentBroken = new EventEmitter();
    constructor() {}

    equipmentWorksClicked() {
        this.equipmentWorked.emit();
    }

    equipmenBrokenClicked() {
        this.equipmentBroken.emit();
    }
}
