import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ParticipantUpdated } from '../models/video-call-models';

@Injectable({
    providedIn: 'root'
})
export class VideoCallEventsService {
    constructor() {}

    private participantUpdatedSubject = new Subject<ParticipantUpdated>();
    get participantUpdated$() {
        return this.participantUpdatedSubject.asObservable();
    }

    handleParticipantUpdated(participantUpdated: ParticipantUpdated) {
        this.participantUpdatedSubject.next(participantUpdated);
    }
}
