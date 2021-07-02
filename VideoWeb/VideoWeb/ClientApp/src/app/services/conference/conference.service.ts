import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, ParamMap, Router } from '@angular/router';
import { Guid } from 'guid-typescript';
import { BehaviorSubject, Observable, ReplaySubject, Subscription } from 'rxjs';
import { filter, map, mergeMap, take } from 'rxjs/operators';
import { ParticipantModel } from 'src/app/shared/models/participant';
import { ApiClient, ConferenceResponse, ConferenceStatus } from '../clients/api-client';
import { EventsService } from '../events.service';
import { LoggerService } from '../logging/logger.service';
import { ConferenceStatusMessage } from '../models/conference-status-message';

@Injectable({
    providedIn: 'root'
})
export class ConferenceService {
    private loggerPrefix = '[ConferenceService] -';

    private subscriptions: Subscription[] = [];
    constructor(
        router: Router,
        private activatedRoute: ActivatedRoute,
        private eventService: EventsService,
        private apiClient: ApiClient,
        private logger: LoggerService
    ) {
        logger.conferenceService = this;
        router.events
            .pipe(
                filter(x => x instanceof NavigationEnd),
                map(() => activatedRoute.snapshot),
                map(route => {
                    while (route && !route.paramMap?.has('conferenceId')) {
                        route = route?.firstChild;
                    }

                    return route?.paramMap;
                })
            )
            .subscribe(paramMap => {
                this.onRouteParamsChanged(paramMap);
            });
    }

    private _currentConference: ConferenceResponse;
    get currentConference(): ConferenceResponse {
        return this._currentConference;
    }

    private currentConferenceSubject = new ReplaySubject<ConferenceResponse>();
    get currentConference$(): Observable<ConferenceResponse> {
        return this.currentConferenceSubject.asObservable();
    }

    private onCurrentConferenceStatusChangedSubject = new BehaviorSubject<{ oldStatus: ConferenceStatus; newStatus: ConferenceStatus }>({
        oldStatus: this.currentConference?.status,
        newStatus: null
    });
    get onCurrentConferenceStatusChanged$() {
        return this.onCurrentConferenceStatusChangedSubject.asObservable();
    }

    private _currentConferenceId: string;
    get currentConferenceId(): string {
        return this._currentConferenceId;
    }

    getConferenceById(conferenceId: string | Guid): Observable<ConferenceResponse> {
        this.logger.info(`${this.loggerPrefix} getting conference by ID: ${conferenceId}`);

        return this.apiClient.getConferenceById(conferenceId.toString());
    }

    getParticipantsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggerPrefix} getting participants for conference.`);

        return this.apiClient
            .getParticipantsByConferenceId(conferenceId.toString())
            .pipe(
                map(participants =>
                    participants.map(participantResponse => ParticipantModel.fromParticipantForUserResponse(participantResponse))
                )
            );
    }

    getEndpointsForConference(conferenceId: Guid | string): Observable<ParticipantModel[]> {
        this.logger.info(`${this.loggerPrefix} getting endpoints for conference.`);

        return this.apiClient.getVideoEndpointsForConference(conferenceId.toString()).pipe(
            map(participants =>
                participants.map(videoEndpointResponse => ParticipantModel.fromVideoEndpointResponse(videoEndpointResponse))
            ),
            take(1)
        );
    }

    getLoggedInParticipantForConference(conferenceId: Guid | string): Observable<ParticipantModel> {
        return this.getParticipantsForConference(conferenceId).pipe(
            mergeMap(participants =>
                this.apiClient.getCurrentParticipant(conferenceId.toString()).pipe(
                    map(response => participants.find(participant => participant.id === response.participant_id)),
                    take(1)
                )
            ),
            take(1)
        );
    }

    setupConferenceSubscriptions() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
        this.subscriptions = [];
        this.subscriptions.push(
            this.eventService
                .getHearingStatusMessage()
                .pipe(filter(conferenceStatusMessage => conferenceStatusMessage.conferenceId === this.currentConferenceId))
                .subscribe(hearingStatusMessage => this.handleConferenceStatusChange(hearingStatusMessage))
        );
    }

    private handleConferenceStatusChange(conferenceStatusMessage: ConferenceStatusMessage): void {
        if (this.currentConference.status !== conferenceStatusMessage.status) {
            const oldValue = this.currentConference.status;
            this.logger.info(`${this.loggerPrefix} updating conference status`, {
                oldValue: oldValue,
                newValue: conferenceStatusMessage.status
            });

            this.currentConference.status = conferenceStatusMessage.status;
            this.onCurrentConferenceStatusChangedSubject.next({ oldStatus: oldValue, newStatus: this.currentConference.status });
        }
    }

    private onRouteParamsChanged(params: ParamMap): void {
        this._currentConferenceId = params?.get('conferenceId');

        this.logger.info(`${this.loggerPrefix} New route - Conference ID: ${this._currentConferenceId}`, {
            routeParams: params
        });

        if (!this._currentConferenceId) {
            this.logger.warn(`${this.loggerPrefix} Could not get conference id from the route parameters: ${params?.get('conferenceId')}`, {
                routeParams: params,
                route: this.activatedRoute
            });
            return;
        }

        this.logger.info(`${this.loggerPrefix} attempting to get conference details.`);
        this.getConferenceById(this.currentConferenceId)
            .pipe(take(1))
            .subscribe(conference => {
                this.logger.info(`${this.loggerPrefix} conference details retrieved.`, {
                    oldDetails: this.currentConference,
                    newDetails: conference
                });

                this._currentConference = conference;
                this.currentConferenceSubject.next(conference);

                this.setupConferenceSubscriptions();
            });
    }
}
