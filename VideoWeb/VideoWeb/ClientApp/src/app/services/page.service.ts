import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PageService {
    private pageRefreshed: Subject<void> = new Subject();

    get pageRefreshed$(): Observable<void> {
        return this.pageRefreshed.asObservable();
    }

    emitPageRefreshed() {
        this.pageRefreshed.next();
    }
}
