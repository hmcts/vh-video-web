import { Component } from '@angular/core';
import { NonHostUserRole } from '../waiting-room-shared/models/non-host-user-role';

@Component({
    standalone: false,
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html'
})
export class ParticipantWaitingRoomComponent {
    UserRole = NonHostUserRole;
}
