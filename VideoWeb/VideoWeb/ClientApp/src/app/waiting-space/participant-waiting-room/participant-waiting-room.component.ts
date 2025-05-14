import { Component } from '@angular/core';
import { WaitingRoomUserRole } from '../waiting-room-shared/models/waiting-room-user-role';

@Component({
    standalone: false,
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html'
})
export class ParticipantWaitingRoomComponent {
    UserRole = WaitingRoomUserRole;
}
