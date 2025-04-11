import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-transfer-message',
    standalone: false,
    templateUrl: './transfer-message.component.html',
    styleUrls: ['../waiting-room-global-styles.scss', '../non-host-waiting-room/non-host-waiting-room.component.scss']
})
export class TransferMessageComponent {
    @Input() outgoingStream: MediaStream | URL;

    emptyString = ''; // Web:S6850 - Empty string is used to clear the value of the input field
}
