import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CallbackFunction } from '../shared/callback-function';

@Injectable({
    providedIn: 'root'
})
export class CommandCentreMenuService {
    private conferenceImClicked: Subject<any> = new Subject();

    onConferenceImClicked(action: CallbackFunction<any>): Subscription {
        return this.conferenceImClicked.subscribe(action);
    }

    emitConferenceImClicked() {
        this.conferenceImClicked.next();
    }
}
