import { Injectable } from '@angular/core';
import { Guid } from 'guid-typescript';
import { BehaviorSubject, Observable } from 'rxjs';
import { ParticipantUpdated } from '../waiting-space/models/video-call-models';
import { VideoCallService } from '../waiting-space/services/video-call.service';

@Injectable({
    providedIn: 'root'
})
export class CountdownStatusService {
    // private participantId?: Guid = null;
    private countdownFinishedSubject = new BehaviorSubject<boolean>(false);
    private countdownParticipantId: string = '';
    constructor(private videoCallService: VideoCallService) {
        this.videoCallService.onParticipantCreated().subscribe(participant => this.handleParticipantCreated(participant));
        this.videoCallService.onParticipantDeleted().subscribe(pexipParticipantId => this.handleParticipantDeleted(pexipParticipantId));
        this.videoCallService.onCallTransferred().subscribe(alias => this.handleCallTransfered(alias));
    }

    get isCountdownFinished(): Observable<boolean> {
        return this.countdownFinishedSubject.asObservable();
    }

    handleCallTransfered(alias: any): void {
        console.log('Muki ja - handleCallTransfered getting triggered');
        // this.participantId = null;
        this.countdownFinishedSubject.next(false);
    }

    private handleParticipantCreated(participant: ParticipantUpdated) {
        console.log('Muki ja - printing out participant - ', participant);
        if (participant.pexipDisplayName.includes('countdown')) {
            this.countdownParticipantId = participant.uuid;
        }

        console.log('Muki ja - handle participant created getting triggered', participant);
        // if (participant. === this.recorderDisplayName) {

        // this.participantId = Guid.parse(participant.uuid);

        // this.countdownFinishedSubject.next(true);
        // }
    }

    private handleParticipantDeleted(pexipParticipantId: Guid) {
        if (this.countdownParticipantId === pexipParticipantId.toString()) {
            this.countdownFinishedSubject.next(true);
        }
        // console.log('Muki ja - handleParticipantDeleted getting triggered', this.participantId);
        // if (this.participantId.equals(pexipParticipantId)) {
        //     this.participantId = null;

        //     this.countdownFinishedSubject.next(false);
        // }
    }
}
