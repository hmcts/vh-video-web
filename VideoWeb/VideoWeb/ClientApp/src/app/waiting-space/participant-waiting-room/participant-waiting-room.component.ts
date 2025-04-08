import { Component } from '@angular/core';
import { UserRole } from '../non-host-waiting-room/non-host-waiting-room.component';

@Component({
    standalone: false,
    selector: 'app-participant-waiting-room',
    templateUrl: './participant-waiting-room.component.html'
})
export class ParticipantWaitingRoomComponent {
    UserRole = UserRole;
}
