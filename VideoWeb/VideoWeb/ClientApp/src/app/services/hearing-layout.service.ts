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

    constructor(
        private logger: Logger,
        private conferenceService: ConferenceService,
        private apiClient: ApiClient,
        private eventsService: EventsService
    ) {
        this.initialise();
    }

    initialise(): void {
        this.conferenceService.currentConference$
            .pipe(
                map(conference => conference.id),
                tap(id => this.logger.debug(`${this.loggerPrefix} currentConference$: ${id}`)),
                distinctUntilChanged()
            )
            .subscribe(
                currentConferenceId => {
                    this.logger.debug(`${this.loggerPrefix} Retrieving current layout for conference: ${currentConferenceId}`);
                    this.apiClient.getLayoutForHearing(currentConferenceId).subscribe(layout => {
                        this.logger.debug(
                            `${this.loggerPrefix} Retrieved current layout (${layout}) for conference: ${currentConferenceId}`
                        );
                        this.currentLayoutSubject.next(layout);
                    });

                    this.logger.debug(`${this.loggerPrefix} subscribing to event hub message for conference: ${currentConferenceId}`);
                    this.eventsService
                        .getHearingLayoutChanged()
                        .pipe(
                            takeUntil(
                                this.conferenceService.currentConference$.pipe(filter(conference => conference.id !== currentConferenceId))
                            ),
                            tap(layoutChanged => {
                                if (layoutChanged.conferenceId === currentConferenceId) return;

                                this.logger.debug(
                                    `${this.loggerPrefix} layout changed from ${layoutChanged.newHearingLayout} to ${layoutChanged.newHearingLayout} for conference: ${currentConferenceId}`
                                );
                            }),
                            filter(layoutChanged => layoutChanged.conferenceId === currentConferenceId)
                        )
                        .subscribe(
                            layoutChanged => {
                                this.logger.info(
                                    `${this.loggerPrefix} layout changed from ${layoutChanged.newHearingLayout} to ${layoutChanged.newHearingLayout} in current conference: ${currentConferenceId}`
                                );
                                this.currentLayoutSubject.next(layoutChanged.newHearingLayout);
                            },
                            error => {
                                this.logger.error(`${this.loggerPrefix} Error in getHearingLayoutChanged subscription.`, error);
                            },
                            () => {
                                this.logger.debug(`${this.loggerPrefix} getHearingLayoutChanged subscription complete`);
                            }
                        );
                },
                error => {
                    this.logger.error(`${this.loggerPrefix} Error in currentConference$ subscription.`, error);
                },
                () => {
                    this.logger.debug(`${this.loggerPrefix} currentConference$ subscription complete`);
                }
            );

        this.eventsService.getHearingLayoutChanged().pipe();
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
                this.eventsService.updateHearingLayout(currentConferenceId, layout);
            });
    }

    get recommendLayout$(): Observable<HearingLayout> {
        return this.conferenceService.currentConference$.pipe(
            distinctUntilChanged((x, y) => x?.id === y?.id),
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
