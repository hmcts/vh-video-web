import { Component } from '@angular/core';

@Component({
    selector: 'app-recording-offence-notice',
    templateUrl: './recording-offence-notice.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', './recording-offence-notice.component.scss']
})
export class RecordingOffenceNoticeComponent {
    showRecordingOffenceNotice: boolean = true;

    dismissRecordingOffenceNotice() {
        this.showRecordingOffenceNotice = false;
    }
}
