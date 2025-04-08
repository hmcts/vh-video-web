import { Component } from '@angular/core';
import { UserRole } from '../non-host-waiting-room/non-host-waiting-room.component';

@Component({
    standalone: false,
    selector: 'app-joh-waiting-room',
    templateUrl: './joh-waiting-room.component.html'
})
export class JohWaitingRoomComponent {
    UserRole = UserRole;
}
