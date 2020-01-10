import { Component, EventEmitter, Output} from '@angular/core';

@Component({ selector: 'app-vho-hearings-filter', template: '' })
export class VhoHearingsFilterStubComponent {
    @Output()
    optionsCounterEvent = new EventEmitter<number>();
}
