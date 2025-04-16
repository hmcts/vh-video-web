import { Component } from '@angular/core';
import { NonHostUserRole } from '../waiting-room-shared/models/non-host-user-role';

@Component({
    standalone: false,
    selector: 'app-joh-waiting-room',
    templateUrl: './joh-waiting-room.component.html'
})
export class JohWaitingRoomComponent {
    UserRole = NonHostUserRole;
}
