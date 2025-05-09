import { Component } from '@angular/core';
import { WaitingRoomUserRole } from '../waiting-room-shared/models/waiting-room-user-role';

@Component({
    standalone: false,
    selector: 'app-judge-waiting-room',
    templateUrl: './judge-waiting-room.component.html'
})
export class JudgeWaitingRoomComponent {
    UserRole = WaitingRoomUserRole;
}
