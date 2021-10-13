import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ApiClient, HearingLayout } from './clients/api-client';
import { ConferenceService } from './conference/conference.service';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class HearingLayoutService implements OnInit, OnDestroy {
    private loggerPrefix = '[HearingLayoutService]';

    private currentLayoutSubject = new ReplaySubject<HearingLayout>(1);
    get currentLayout$(): Observable<HearingLayout> {
        return this.currentLayoutSubject.asObservable();
    }

    constructor(
        private logger: Logger,
        private conferenceService: ConferenceService,
        private apiClient: ApiClient,
        private eventsService: EventsService
    ) {}

    ngOnInit(): void {
        throw new Error('Method not implemented.');
    }

    ngOnDestroy(): void {
        throw new Error('Method not implemented.');
    }

    getCurrentLayout(): Observable<HearingLayout> {
        throw new Error('Method not implemented.');
    }

    updateCurrentLayout(layout: HearingLayout) {
        throw new Error('Method not implemented.');
    }
}
