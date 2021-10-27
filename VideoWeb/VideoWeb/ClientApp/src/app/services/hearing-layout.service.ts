import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, take, takeUntil, tap } from 'rxjs/operators';
import { ApiClient, HearingLayout } from './clients/api-client';
import { ConferenceService } from './conference/conference.service';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';

@Injectable({
    providedIn: 'root'
})
export class HearingLayoutService {
    private loggerPrefix = '[HearingLayoutService] -';

    private currentLayoutSubject = new ReplaySubject<HearingLayout>(1);
    get currentLayout$(): Observable<HearingLayout> {
        return this.currentLayoutSubject.asObservable();
    }

    private recommendedLayoutSubject = new ReplaySubject<HearingLayout>(1);
    get recommendedLayout$(): Observable<HearingLayout> {
        return this.recommendedLayoutSubject.asObservable();
    }

    constructor(
        private logger: Logger,
        private conferenceService: ConferenceService,
        private apiClient: ApiClient,
        private eventsService: EventsService
    ) {
        this.initialiseCurrentLayoutSubscriptions();
        this.initialiseRecommendedLayoutSubscriptions();
    }

    initialiseCurrentLayoutSubscriptions(): void {
        this.eventsService.getServiceConnected().subscribe(() => {
            this.logger.debug(`${this.loggerPrefix} eventsService connected/reconnected getting the current layout`);
            this.getCurrentLayout().subscribe(layout => {
                this.currentLayoutSubject.next(layout);
                this.logger.debug(`${this.loggerPrefix} Retrieved and updated current layout (${layout})`);
            });
        });

        this.conferenceService.currentConference$
            .pipe(
                map(conference => conference?.id),
                tap(id => this.logger.debug(`${this.loggerPrefix} currentConference$: ${id}`)),
                distinctUntilChanged((x, y) => x === y),
                filter(id => !!id)
            )
            .subscribe(currentConferenceId => {
                this.logger.debug(`${this.loggerPrefix} Retrieving current layout for conference: ${currentConferenceId}`);
                this.apiClient.getLayoutForHearing(currentConferenceId).subscribe(layout => {
                    this.logger.info(`${this.loggerPrefix} Retrieved current layout (${layout}) for conference: ${currentConferenceId}`);
                    this.currentLayoutSubject.next(layout);
                });

                this.logger.debug(`${this.loggerPrefix} subscribing to event hub message for conference: ${currentConferenceId}`);
                this.eventsService
                    .getHearingLayoutChanged()
                    .pipe(
                        takeUntil(
                            this.conferenceService.currentConference$.pipe(filter(conference => conference?.id !== currentConferenceId))
                        ),
                        tap(layoutChanged => {
                            if (layoutChanged.conferenceId === currentConferenceId) {
                                return;
                            }

                            this.logger.debug(
                                `${this.loggerPrefix} layout changed from ${layoutChanged.oldHearingLayout} to ${layoutChanged.newHearingLayout} for conference: ${currentConferenceId}`
                            );
                        }),
                        filter(layoutChanged => layoutChanged.conferenceId === currentConferenceId)
                    )
                    .subscribe(layoutChanged => {
                        this.logger.info(
                            `${this.loggerPrefix} layout changed from ${layoutChanged.oldHearingLayout} to ${layoutChanged.newHearingLayout} in current conference: ${currentConferenceId}`
                        );
                        this.currentLayoutSubject.next(layoutChanged.newHearingLayout);
                    });
            });
    }

    initialiseRecommendedLayoutSubscriptions() {
        this.conferenceService.currentConference$
            .pipe(
                distinctUntilChanged((x, y) => x?.id === y?.id),
                filter(conference => !!conference),
                map(conference => conference.id),
                tap(() => {
                    this.logger.debug(`${this.loggerPrefix} Conference changed getting the new recommended layout`);
                    this.getCurrentRecommendedLayout().subscribe(layout => {
                        this.logger.info(`${this.loggerPrefix} Conference changed got the new recommended layout ${layout}`);
                        this.recommendedLayoutSubject.next(layout);
                    });
                }),
                mergeMap(currentConferenceId => {
                    return this.eventsService.getParticipantsUpdated().pipe(
                        takeUntil(
                            this.conferenceService.currentConference$.pipe(filter(conference => conference?.id !== currentConferenceId))
                        ),
                        filter(update => update.conferenceId === currentConferenceId),
                        tap(() => {
                            this.logger.debug(`${this.loggerPrefix} Participant list updated getting the new recommended layout`);
                        }),
                        mergeMap(() => this.getCurrentRecommendedLayout())
                    );
                })
            )
            .subscribe(layout => {
                this.logger.info(`${this.loggerPrefix} Participant list updated got the new recommended layout ${layout}`);
                this.recommendedLayoutSubject.next(layout);
            });
    }

    getCurrentRecommendedLayout(): Observable<HearingLayout> {
        return this.conferenceService.currentConference$.pipe(
            take(1),
            map(conference => conference.id),
            mergeMap(conferenceId => this.apiClient.getRecommendedLayoutForHearing(conferenceId))
        );
    }

    getCurrentLayout(): Observable<HearingLayout> {
        return this.conferenceService.currentConference$.pipe(
            take(1),
            map(conference => conference.id),
            mergeMap(currentConferenceId => this.apiClient.getLayoutForHearing(currentConferenceId))
        );
    }

    updateCurrentLayout(layout: HearingLayout) {
        this.conferenceService.currentConference$
            .pipe(
                take(1),
                map(conference => conference.id)
            )
            .subscribe(currentConferenceId => {
                this.logger.info(
                    `${this.loggerPrefix} updating current layout to ${layout} for current conference: ${currentConferenceId}`
                );
                this.apiClient.updateLayoutForHearing(currentConferenceId, layout).subscribe();
            });
    }
}
