import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ApiClient, ConferenceStatus, StartOrResumeVideoHearingRequest } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { VideoCallService } from '../../services/video-call.service';
import { ConferenceState } from '../reducers/conference.reducer';
import { VideoCallHostActions } from '../actions/video-call-host.actions';
import { catchError, delay, exhaustMap, filter, map, retry, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { concatLatestFrom } from '@ngrx/operators';
import { EventsService } from 'src/app/services/events.service';
import { of } from 'rxjs';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ConferenceActions } from '../actions/conference.actions';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { HearingLayoutService } from 'src/app/services/hearing-layout.service';
import { ErrorService } from 'src/app/services/error.service';

@Injectable()
export class VideoCallHostEffects {
    // Panel List controls
    // Mute All
    localMuteAllParticipants$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.localMuteAllParticipants),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Locally muting all participants`, {
                        conferenceId: conference.id
                    });
                    this.eventsService.updateAllParticipantLocalMuteStatus(conference.id, true);
                })
            ),
        { dispatch: false }
    );

    // Unmute All
    localUnmuteAllParticipants$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.localUnmuteAllParticipants),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Locally unmuting all participants`, {
                        conferenceId: conference.id
                    });
                    // if we're locally unmuting all participants, we should also unlock the conference
                    this.eventsService.updateAllParticipantLocalMuteStatus(conference.id, false);
                })
            ),
        { dispatch: false }
    );

    // Mute & Lock
    remoteMuteAndLockAllParticipants$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.remoteMuteAndLockAllParticipants),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Remote muting the guests and blocking their ability to unmute`, {
                        conferenceId: conference.id
                    });
                    // there is an effect that locally mutes participants when remote muted
                    this.videoCallService.muteAllParticipants(true, conference.id);
                })
            ),
        { dispatch: false }
    );

    // Unlock Mute
    unlockRemoteMute$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.unlockRemoteMute),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Enabling guests the ability to unmute themselves`, {
                        conferenceId: conference.id
                    });
                    this.videoCallService.muteAllParticipants(false, conference.id);
                })
            ),
        { dispatch: false }
    );

    // Lower hands
    lowerAllParticipantHands$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.lowerAllParticipantHands),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Lowering all participant hands`, {
                        conferenceId: conference.id
                    });
                    this.videoCallService.lowerAllHands(conference.id);
                })
            ),
        { dispatch: false }
    );

    // Context Menu actions
    // Unlock Mute
    unlockRemoteMuteParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.unlockRemoteMuteForParticipant),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    let pexipParticipant = conference.participants.find(x => x.id === action.participantId)?.pexipInfo;

                    if (!pexipParticipant) {
                        pexipParticipant = conference.endpoints.find(x => x.id === action.participantId)?.pexipInfo;
                    }
                    this.logger.info(`${this.loggerPrefix} Unlocking participant remote mute`, {
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        pexipUUID: pexipParticipant.uuid
                    });
                    this.videoCallService.muteParticipant(pexipParticipant.uuid, false, conference.id, action.participantId);
                })
            ),
        { dispatch: false }
    );

    // Mute & Lock
    lockRemoteMuteParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.lockRemoteMuteForParticipant),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    let pexipParticipant = conference.participants.find(x => x.id === action.participantId)?.pexipInfo;

                    if (!pexipParticipant) {
                        pexipParticipant = conference.endpoints.find(x => x.id === action.participantId)?.pexipInfo;
                    }
                    this.logger.info(`${this.loggerPrefix} Toggling participant remote mute`, {
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        pexipUUID: pexipParticipant.uuid
                    });
                    this.videoCallService.muteParticipant(pexipParticipant.uuid, true, conference.id, action.participantId);
                })
            ),
        { dispatch: false }
    );

    // Lower hand
    lowerParticipantHand$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.lowerParticipantHand),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Lowering participant hand`, {
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        pexipUUID: conference.participants.find(x => x.id === action.participantId).pexipInfo.uuid
                    });
                    const participant = conference.participants.find(x => x.id === action.participantId);
                    this.videoCallService.lowerHandById(participant.pexipInfo.uuid, conference.id, participant.id);
                })
            ),
        { dispatch: false }
    );

    // Mute
    localMuteParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.localMuteParticipant),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Locally muting the participant's microphone`, {
                        conferenceId: conference.id,
                        participantId: action.participantId
                    });
                    const participant = conference.participants.find(x => x.id === action.participantId);
                    this.eventsService.updateParticipantLocalMuteStatus(conference.id, participant.id, true);
                })
            ),
        { dispatch: false }
    );

    // Unmute
    localUnmuteParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.localMuteParticipant),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Locally unmuting the participant's microphone`, {
                        conferenceId: conference.id,
                        participantId: action.participantId
                    });
                    const participant = conference.participants.find(x => x.id === action.participantId);
                    this.eventsService.updateParticipantLocalMuteStatus(conference.id, participant.id, false);
                })
            ),
        { dispatch: false }
    );

    // Spotlight
    spotlightParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.spotlightParticipant),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    const participant = conference.participants.find(x => x.id === action.participantId);
                    this.logger.info(`${this.loggerPrefix} Spotlighting participant`, {
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        pexipUUID: participant.pexipInfo.uuid
                    });
                    this.videoCallService.spotlightParticipant(participant.pexipInfo.uuid, true, conference.id, participant.id);
                })
            ),
        { dispatch: false }
    );

    // Remove Spotlight
    removeSpotlightForParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.removeSpotlightForParticipant),
                concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(([_, conference]) => !!conference),
                tap(([action, conference]) => {
                    const participant = conference.participants.find(x => x.id === action.participantId);
                    this.logger.info(`${this.loggerPrefix} Removing Spotlight for participant`, {
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        pexipUUID: participant.pexipInfo.uuid
                    });
                    this.videoCallService.spotlightParticipant(participant.pexipInfo.uuid, false, conference.id, participant.id);
                })
            ),
        { dispatch: false }
    );

    // Admit <role>
    // Regular admit without delay
    admitParticipantOnCountdownIncomplete$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.admitParticipant),
            concatLatestFrom(_ => [
                this.store.select(ConferenceSelectors.getActiveConference),
                this.store.select(ConferenceSelectors.getCountdownComplete)
            ]),
            filter(([_, conference, isCountdownComplete]) => !!conference && !isCountdownComplete),
            tap(([action, conference]) => {
                // Dispatch transfer action immediately
                this.store.dispatch(
                    ConferenceActions.sendTransferRequest({
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        transferDirection: TransferDirection.In
                    })
                );
            }),
            switchMap(([action, conference]) => {
                this.logger.debug(`${this.loggerPrefix} Admitting participant immediately since countdown is not complete`, {
                    conferenceId: conference.id,
                    participantId: action.participantId
                });

                return this.apiClient.callParticipant(conference.id, action.participantId).pipe(
                    map(() => VideoCallHostActions.admitParticipantSuccess()),
                    catchError(error =>
                        of(
                            VideoCallHostActions.admitParticipantFailure({
                                error,
                                participantId: action.participantId,
                                conferenceId: conference.id
                            })
                        )
                    )
                );
            })
        )
    );

    // Delayed admit with 10 second delay
    admitParticipantOnCountdownComplete$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.admitParticipant),
            concatLatestFrom(() => [
                this.store.select(ConferenceSelectors.getActiveConference),
                this.store.select(ConferenceSelectors.getCountdownComplete)
            ]),
            filter(([_, conference, isCountdownComplete]) => !!conference && isCountdownComplete),
            tap(([action, conference]) => {
                // Dispatch transfer action immediately
                this.store.dispatch(
                    ConferenceActions.sendTransferRequest({
                        conferenceId: conference.id,
                        participantId: action.participantId,
                        transferDirection: TransferDirection.In
                    })
                );
            }),
            delay(10000),
            concatLatestFrom(() => this.store.select(ConferenceSelectors.getActiveConference)), // Re-fetch the conference state to make sure it's still in session
            filter(([_, conference]) => conference.status === ConferenceStatus.InSession),
            switchMap(([action, conference]) =>
                this.apiClient.callParticipant(conference.id, action[0].participantId).pipe(
                    map(() => VideoCallHostActions.admitParticipantSuccess()),
                    catchError(error =>
                        of(
                            VideoCallHostActions.admitParticipantFailure({
                                error,
                                participantId: action[0].participantId,
                                conferenceId: conference.id
                            })
                        )
                    )
                )
            )
        )
    );

    admitParticipantFailure$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.admitParticipantFailure),
            switchMap(action => {
                this.logger.error(`${this.loggerPrefix} Admit participant failed`, action.error);
                return [
                    ConferenceActions.sendTransferRequest({
                        conferenceId: action.conferenceId,
                        participantId: action.participantId,
                        transferDirection: TransferDirection.Out
                    })
                ];
            })
        )
    );

    // Dismiss <role>
    dismissParticipant$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.dismissParticipant),
            concatLatestFrom(_ => this.store.select(ConferenceSelectors.getActiveConference)),
            filter(([_, conference]) => !!conference),
            switchMap(([action, conference]) => {
                this.logger.info(`${this.loggerPrefix} Dismissing participant`, {
                    conferenceId: conference.id,
                    participantId: action.participantId
                });
                return this.apiClient.dismissParticipant(conference.id, action.participantId).pipe(
                    map(() => VideoCallHostActions.dismissParticipantSuccess()),
                    catchError(error => of(VideoCallHostActions.dismissParticipantFailure({ error })))
                );
            })
        )
    );

    startHearing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.startHearing),
            withLatestFrom(this.layoutService.currentLayout$),
            exhaustMap(([action, layout]) => {
                this.logger.info(`${this.loggerPrefix} Starting hearing`, {
                    conferenceId: action.conferenceId
                });
                const request = new StartOrResumeVideoHearingRequest({
                    layout
                });
                return this.apiClient.startOrResumeVideoHearing(action.conferenceId, request).pipe(
                    retry(3), // sometimes the supplier API fail
                    map(() => VideoCallHostActions.startHearingSuccess()),
                    catchError(error => of(VideoCallHostActions.startHearingFailure({ error })))
                );
            })
        )
    );

    startHearingFailure$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallHostActions.startHearingFailure),
                tap(action => {
                    this.logger.error(`${this.loggerPrefix} Start hearing failed`, action.error);
                    this.errorService.handleApiError(action.error);
                })
            ),
        { dispatch: false }
    );

    pauseHearing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.pauseHearing),
            exhaustMap(action => {
                this.logger.info(`${this.loggerPrefix} Pausing hearing`, {
                    conferenceId: action.conferenceId
                });
                return this.apiClient.pauseVideoHearing(action.conferenceId).pipe(
                    map(() => VideoCallHostActions.pauseHearingSuccess()),
                    catchError(error => of(VideoCallHostActions.pauseHearingFailure({ error })))
                );
            })
        )
    );

    suspendHearing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.suspendHearing),
            exhaustMap(action => {
                this.logger.info(`${this.loggerPrefix} Suspending hearing`, {
                    conferenceId: action.conferenceId
                });
                return this.apiClient.suspendVideoHearing(action.conferenceId).pipe(
                    map(() => VideoCallHostActions.suspendHearingSuccess()),
                    catchError(error => of(VideoCallHostActions.suspendHearingFailure({ error })))
                );
            })
        )
    );

    endHearing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.endHearing),
            exhaustMap(action => {
                this.logger.info(`${this.loggerPrefix} Ending hearing`, {
                    conferenceId: action.conferenceId
                });
                return this.apiClient.endVideoHearing(action.conferenceId).pipe(
                    map(() => VideoCallHostActions.endHearingSuccess()),
                    catchError(error => of(VideoCallHostActions.endHearingFailure({ error })))
                );
            })
        )
    );

    hostLeaveHearing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.hostLeaveHearing),
            exhaustMap(action => {
                this.logger.info(`${this.loggerPrefix} Host leaving hearing`, {
                    conferenceId: action.conferenceId,
                    participantId: action.participantId
                });
                return this.apiClient.leaveHearing(action.conferenceId, action.participantId).pipe(
                    map(() => VideoCallHostActions.hostLeaveHearingSuccess()),
                    catchError(error => of(VideoCallHostActions.hostLeaveHearingFailure({ error })))
                );
            })
        )
    );

    joinHearing$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallHostActions.joinHearing),
            exhaustMap(action => {
                this.logger.info(`${this.loggerPrefix} Joining hearing`, {
                    participantId: action.participantId
                });
                return this.apiClient.joinHearingInSession(action.conferenceId, action.participantId).pipe(
                    map(() => VideoCallHostActions.joinHearingSuccess()),
                    catchError(error => of(VideoCallHostActions.joinHearingFailure({ error })))
                );
            })
        )
    );

    private readonly loggerPrefix = '[VideoCallHostEffect] -';
    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private eventsService: EventsService,
        private videoCallService: VideoCallService,
        private apiClient: ApiClient,
        private layoutService: HearingLayoutService,
        private errorService: ErrorService,
        private logger: Logger
    ) {}
}
