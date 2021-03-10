import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { YesNoPopupBaseDirective } from './yes-no-popup-base.component';

@Component({
    selector: 'app-confirm-start-hearing-popup',
    templateUrl: './confirm-start-hearing-popup.component.html',
    styleUrls: ['./yes-no-popup-base.component.scss']
})
export class ConfirmStartHearingPopupComponent extends YesNoPopupBaseDirective {
    @Input() hearingStarted = false;

    constructor(protected translateService: TranslateService) {
        super();
    }

    get action(): string {
        return this.hearingStarted
            ? this.translateService.instant('confirm-start-hearing-popup.resume')
            : this.translateService.instant('confirm-start-hearing-popup.start');
    }
}
