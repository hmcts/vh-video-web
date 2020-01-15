import { Component, EventEmitter, Output} from '@angular/core';
import { HearingsFilter } from '../../shared/models/hearings-filter';

@Component({ selector: 'app-vho-hearings-filter', template: '' })
export class VhoHearingsFilterStubComponent {
    @Output()
    fiterOptionsEvent = new EventEmitter<HearingsFilter>();
}
