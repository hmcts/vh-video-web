import { Component } from '@angular/core';
import { WaitingRoomUserRole } from '../waiting-room-shared/models/waiting-room-user-role';

@Component({
    standalone: false,
    selector: 'app-joh-waiting-room',
    templateUrl: './joh-waiting-room.component.html'
})
export class JohWaitingRoomComponent {
    UserRole = WaitingRoomUserRole;
}
