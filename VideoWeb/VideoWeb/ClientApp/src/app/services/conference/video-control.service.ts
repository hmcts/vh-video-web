import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VideoControlService {
    constructor() {}

    getSpotlightedParticipants(conferenceId: string): Observable<string[]> {
        throw Error('Not implemented');
    }
}
