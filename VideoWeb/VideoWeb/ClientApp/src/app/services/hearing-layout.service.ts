import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, map, mergeMap, skip, take, takeUntil } from 'rxjs/operators';
import { ApiClient, HearingLayout } from './clients/api-client';
import { ConferenceService } from './conference/conference.service';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class HearingLayoutService implements OnInit, OnDestroy {
    private loggerPrefix = '[HearingLayoutService]';
    private destroyedSubject: Subject<void>;

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
        this.logger.debug(`${this.loggerPrefix} subscribing to event hub message`);

        this.destroyedSubject = new Subject();
        this.conferenceService.currentConference$.pipe(takeUntil(this.destroyedSubject)).subscribe(currentConference => {
            this.apiClient.getLayoutForHearing(currentConference.id).subscribe(layout => this.currentLayoutSubject.next(layout));

            this.eventsService
                .getHearingLayoutChanged()
                .pipe(
                    takeUntil(this.destroyedSubject),
                    takeUntil(this.conferenceService.currentConference$.pipe(skip(1))),
                    filter(layoutChanged => layoutChanged.conferenceId === currentConference.id)
                )
                .subscribe(layoutChanged => this.currentLayoutSubject.next(layoutChanged.newHearingLayout));
        });

        this.eventsService.getHearingLayoutChanged().pipe();
    }

    ngOnDestroy(): void {
        this.destroyedSubject.next();
        this.destroyedSubject.complete();
    }

    getCurrentLayout(): Observable<HearingLayout> {
        return this.conferenceService.currentConference$.pipe(
            take(1),
            mergeMap(currentConference => this.apiClient.getLayoutForHearing(currentConference.id))
        );
    }

    updateCurrentLayout(layout: HearingLayout) {
        this.conferenceService.currentConference$.pipe(take(1)).subscribe(currentConference => {
            this.eventsService.updateHearingLayout(currentConference.id, layout);
        });
    }

    getRecommendLayout(): Observable<HearingLayout> {
        return this.conferenceService.currentConference$.pipe(
            take(1),
            map(conference => {
                const numOfParticipantsIncJudge = conference.participants.length + conference.endpoints.length;

                if (numOfParticipantsIncJudge >= 10) {
                    return HearingLayout.TwoPlus21;
                }

                if (numOfParticipantsIncJudge >= 6 && numOfParticipantsIncJudge <= 9) {
                    return HearingLayout.OnePlus7;
                }

                return HearingLayout.Dynamic;
            })
        );
    }
}
