import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { CallbackFunction } from '../shared/callback-function';

@Injectable({
    providedIn: 'root'
})
export class PageService {
    private pageRefreshed: Subject<any> = new Subject();

    onPageRefreshed(action: CallbackFunction<any>): Subscription {
        return this.pageRefreshed.subscribe(action);
    }

    emitPageRefreshed() {
        this.pageRefreshed.next();
    }
}
