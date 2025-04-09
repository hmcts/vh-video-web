import { Component, Input } from '@angular/core';
import { VHHearing } from 'src/app/shared/models/hearing.vh';

@Component({
    selector: 'app-please-wait-panel-for-joh',
    standalone: false,
    templateUrl: './please-wait-panel-for-joh.component.html',
    styleUrls: ['../waiting-room-global-styles.scss']
})
export class PleaseWaitPanelForJohComponent {
    @Input() hearing: VHHearing;
    @Input() currentTime: Date;

    getCurrentTimeClass() {
        if (this.hearing.isSuspended()) {
            return 'hearing-delayed';
        }
        return 'hearing-on-time';
    }
}
