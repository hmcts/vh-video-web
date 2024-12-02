import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CommandCentreMenuService {
    private conferenceImClicked: Subject<void> = new Subject();

    get conferenceImClicked$(): Observable<void> {
        return this.conferenceImClicked.asObservable();
    }

    emitConferenceImClicked() {
        this.conferenceImClicked.next();
    }
}
