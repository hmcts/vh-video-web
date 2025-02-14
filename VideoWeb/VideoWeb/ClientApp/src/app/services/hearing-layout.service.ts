import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ApiClient, HearingLayout } from './clients/api-client';
import { EventsService } from './events.service';
import { Logger } from './logging/logger-base';
import { ConferenceState } from 'src/app/waiting-space/store/reducers/conference.reducer';
import * as ConferenceSelectors from 'src/app/waiting-space/store/selectors/conference.selectors';
import { Store } from '@ngrx/store';

@Injectable({
    providedIn: 'root'
})
export class HearingLayoutService {
    private loggerPrefix = '[HearingLayoutService] -';

    private currentLayoutSubject = new ReplaySubject<HearingLayout>(1);
    private recommendedLayoutSubject = new ReplaySubject<HearingLayout>(1);

    private activeConference$ = this.store.select(ConferenceSelectors.getActiveConference).pipe(
        filter(conference => !!conference),
        distinctUntilChanged((x, y) => x.id === y.id),
        map(conference => conference.id)
    );

    constructor(
        private logger: Logger,
        private apiClient: ApiClient,
        private store: Store<ConferenceState>,
        private eventsService: EventsService
    ) {
        this.initialiseCurrentLayoutSubscriptions();
        this.initialiseRecommendedLayoutSubscriptions();
    }

    get currentLayout$(): Observable<HearingLayout> {
        return this.currentLayoutSubject.asObservable();
    }

    get recommendedLayout$(): Observable<HearingLayout> {
        return this.recommendedLayoutSubject.asObservable();
    }

    initialiseCurrentLayoutSubscriptions(): void {
        this.eventsService
            .getServiceConnected()
            .pipe(
                switchMap(() => {
                    this.logger.debug(`${this.loggerPrefix} eventsService connected/reconnected getting the current layout`);
                    return this.getCurrentLayout();
                })
            )
            .subscribe(layout => {
                this.currentLayoutSubject.next(layout);
                this.logger.debug(`${this.loggerPrefix} Retrieved and updated current layout (${layout})`);
            });

        this.activeConference$
            .pipe(
                switchMap(currentConferenceId => {
                    this.logger.debug(`${this.loggerPrefix} Retrieving current layout for conference: ${currentConferenceId}`);
                    return this.apiClient.getLayoutForHearing(currentConferenceId).pipe(
                        tap(layout => {
                            this.logger.debug(
                                `${this.loggerPrefix} Retrieved current layout (${layout}) for conference: ${currentConferenceId}`
                            );
                            this.currentLayoutSubject.next(layout);
                        }),
                        switchMap(() =>
                            this.eventsService.getHearingLayoutChanged().pipe(
                                takeUntil(
                                    this.store
                                        .select(ConferenceSelectors.getActiveConference)
                                        .pipe(filter(conference => conference?.id !== currentConferenceId))
                                ),
                                filter(layoutChanged => layoutChanged.conferenceId === currentConferenceId),
                                tap(layoutChanged => {
                                    this.logger.info(
                                        `${this.loggerPrefix} layout changed from ${layoutChanged.oldHearingLayout} to ${layoutChanged.newHearingLayout} in current conference: ${currentConferenceId}`
                                    );
                                    this.currentLayoutSubject.next(layoutChanged.newHearingLayout);
                                })
                            )
                        )
                    );
                })
            )
            .subscribe();
    }

    initialiseRecommendedLayoutSubscriptions() {
        const participantsUpdated$ = this.eventsService.getParticipantsUpdated();
        this.activeConference$
            .pipe(
                tap(() => {
                    this.logger.debug(`${this.loggerPrefix} getting the recommended layout`);
                    this.getCurrentRecommendedLayout().subscribe(layout => {
                        this.logger.debug(`${this.loggerPrefix} got the recommended layout ${layout}`);
                        this.recommendedLayoutSubject.next(layout);
                    });
                }),
                switchMap(currentConferenceId =>
                    participantsUpdated$.pipe(
                        takeUntil(
                            this.store
                                .select(ConferenceSelectors.getActiveConference)
                                .pipe(filter(conference => conference?.id !== currentConferenceId))
                        ),
                        filter(update => update.conferenceId === currentConferenceId),
                        tap(() => {
                            this.logger.debug(`${this.loggerPrefix} Participant list updated getting the new recommended layout`);
                        }),
                        switchMap(() => this.getCurrentRecommendedLayout())
                    )
                )
            )
            .subscribe(layout => {
                this.logger.debug(`${this.loggerPrefix} Participant list updated got the new recommended layout ${layout}`);
                this.recommendedLayoutSubject.next(layout);
            });
    }

    getCurrentRecommendedLayout(): Observable<HearingLayout> {
        return this.activeConference$.pipe(
            take(1),
            mergeMap(currentConferenceId => this.apiClient.getRecommendedLayoutForHearing(currentConferenceId))
        );
    }

    getCurrentLayout(): Observable<HearingLayout> {
        return this.activeConference$.pipe(
            take(1),
            mergeMap(currentConferenceId => this.apiClient.getLayoutForHearing(currentConferenceId))
        );
    }

    updateCurrentLayout(layout: HearingLayout) {
        return this.activeConference$.pipe(take(1)).subscribe(currentConferenceId => {
            this.logger.debug(`${this.loggerPrefix} updating current layout to ${layout} for current conference: ${currentConferenceId}`);
            this.apiClient.updateLayoutForHearing(currentConferenceId, layout).subscribe();
        });
    }
}
