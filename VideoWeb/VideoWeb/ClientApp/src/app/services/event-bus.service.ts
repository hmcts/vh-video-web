import { Injectable } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface CallbackFunction<T = any> {
    (event: T): void;
}

@Injectable({
    providedIn: 'root'
})
export class EventBusService {
    private eventStream: Subject<any>;

    constructor() {
        this.eventStream = new Subject();
    }

    on<T>(eventType: VHEventType, action: CallbackFunction<T>): Subscription {
        return this.eventStream
            .pipe(
                filter((e: EmitEvent<T>) => {
                    return e.eventType === eventType;
                }),
                map((event: EmitEvent<T>) => {
                    return event.value;
                })
            )
            .subscribe(action);
    }

    emit<T>(event: EmitEvent<T>) {
        this.eventStream.next(event);
    }
}

export class EmitEvent<T> {
    constructor(public eventType: VHEventType, public value?: T) {}
}

export enum VHEventType {
    TaskCompleted
}
