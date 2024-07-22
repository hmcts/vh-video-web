import { Component, Input } from '@angular/core';
import { ConferenceResponse } from '../../services/clients/api-client';

@Component({
    selector: 'app-change-hearing-layout-popup',
    templateUrl: './change-hearing-layout.component.html',
    styleUrls: ['./change-hearing-layout.component.scss']
})
export class ChangeHearingLayoutPopupComponent {
    @Input() conference: ConferenceResponse;
    @Input() onLayoutUpdate: Function;
}
