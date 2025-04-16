import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { of } from 'rxjs';
import { catchError, switchMap, map, tap, filter } from 'rxjs/operators';
import {
    ApiClient,
    ConferenceStatus,
    EndpointStatus,
    ParticipantStatus,
    Role,
    UpdateParticipantDisplayNameRequest
} from 'src/app/services/clients/api-client';
import { ConferenceActions } from '../actions/conference.actions';
import { mapConferenceToVHConference } from '../models/api-contract-to-state-model-mappers';
import { ConferenceState } from '../reducers/conference.reducer';
import { Store } from '@ngrx/store';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { SupplierClientService } from 'src/app/services/api/supplier-client.service';
import { VideoCallService } from '../../services/video-call.service';
import { ErrorService } from 'src/app/services/error.service';
import { HearingVenueFlagsService } from 'src/app/services/hearing-venue-flags.service';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { UserMediaStreamServiceV2 } from 'src/app/services/user-media-stream-v2.service';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';

@Injectable()
export class ConferenceEffects {
    loadConference$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.loadConference),
            switchMap(action =>
                this.apiClient.getConferenceById(action.conferenceId).pipe(
                    map(conference => ConferenceActions.loadConferenceSuccess({ conference: mapConferenceToVHConference(conference) })),
                    catchError(error => of(ConferenceActions.loadConferenceFailure({ error })))
                )
            )
        )
    );

    loadLoggedInParticipantOnConferenceLoadSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.loadConferenceSuccess),
            switchMap(action =>
                this.apiClient
                    .getCurrentParticipant(action.conference.id)
                    .pipe(map(participant => ConferenceActions.loadLoggedInParticipant({ participantId: participant.participant_id })))
            )
        )
    );

    loadConferenceFailure$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.loadConferenceFailure),
                tap(action => {
                    this.errorService.handleApiError(action.error);
                })
            ),
        { dispatch: false }
    );

    loadLoggedInParticipant$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.loadLoggedInParticipant),
            concatLatestFrom(() => this.store.select(ConferenceSelectors.getParticipants)),
            filter(
                ([action, participants]) =>
                    participants?.length > 0 && participants.includes(participants.find(p => p.id === action.participantId))
            ),
            switchMap(([action, participants]) =>
                of(ConferenceActions.loadLoggedInParticipantSuccess({ participant: participants.find(p => p.id === action.participantId) }))
            )
        )
    );

    loadConferenceSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.loadConferenceSuccess),
                tap(action => {
                    this.supplierClientService.loadSupplierScript(action.conference.supplier);
                    this.venueFlagService.setHearingVenueIsScottish(action.conference.isVenueScottish);
                })
            ),
        { dispatch: false }
    );

    releaseMediaStreamOnLeaveConference$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.leaveConference),
                tap(() => {
                    this.logger.info(`${this.loggerPrefix} Releasing media stream on leave conference`);
                    this.userMediaStreamService.closeCurrentStream();
                })
            ),
        { dispatch: false }
    );

    updateHostDisplayName$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.updateJudgeDisplayName, ConferenceActions.updateStaffMemberDisplayName),
            switchMap(action =>
                this.apiClient
                    .updateParticipantDisplayName(
                        action.conferenceId,
                        action.participantId,
                        new UpdateParticipantDisplayNameRequest({ display_name: action.displayName })
                    )
                    .pipe(
                        map(() =>
                            ConferenceActions.updateParticipantDisplayNameSuccess({
                                conferenceId: action.conferenceId,
                                participantId: action.participantId,
                                displayName: action.displayName
                            })
                        )
                    )
            )
        )
    );

    participantDisconnect$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantStatus),
                filter(action => action.status === ParticipantStatus.Disconnected),
                concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
                switchMap(([action, participant]) => {
                    if (participant?.id !== action.participantId) {
                        return of();
                    }
                    // the pexip info is not set when in the waiting room so we have to default to the video call service
                    const callTag = this.videoCallService.pexipAPI?.call_tag ?? participant?.pexipInfo?.callTag;
                    if (action.reason.includes(`connected on another device ${callTag}`)) {
                        this.errorService.goToServiceError(
                            'error-service.unexpected-error',
                            'error-service.connected-another-device',
                            false
                        );
                    }
                    if (action.reason.toLowerCase().includes('no heartbeat received due to temporary network disruption')) {
                        this.errorService.goToServiceError('error-service.unexpected-error', 'error-service.problem-with-connection', true);
                    }
                    return of();
                })
            ),
        { dispatch: false }
    );

    sendTransferRequest$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.sendTransferRequest),
                tap(action => {
                    this.eventsService.sendTransferRequest(action.conferenceId, action.participantId, action.transferDirection);
                })
            ),
        { dispatch: false }
    );

    lockConferenceWhenAllInHearingParticipantsMuted$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.upsertPexipParticipant),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant),
                    this.store.select(ConferenceSelectors.getPexipConference)
                ]),
                filter(
                    ([_, conference, loggedInParticipant, pexipConference]) =>
                        !!conference &&
                        loggedInParticipant.status === ParticipantStatus.InHearing &&
                        !pexipConference.guestsMuted &&
                        loggedInParticipant.pexipInfo?.role === 'chair'
                ),
                filter(([_, conference]) => {
                    const inHearingParticipants = conference.participants.filter(
                        p => p.status === ParticipantStatus.InHearing && ![Role.StaffMember, Role.Judge].includes(p.role)
                    );
                    const inHearingEndpoints = conference.endpoints.filter(e => e.status === EndpointStatus.InHearing);

                    const allParticipantsMuted = inHearingParticipants
                        .filter(p => p.status === ParticipantStatus.InHearing && !!p.pexipInfo)
                        .every(p => p.pexipInfo.isRemoteMuted);
                    const allEndpointsMuted = inHearingEndpoints
                        .filter(e => e.status === EndpointStatus.InHearing && !!e.pexipInfo)
                        .every(e => e.pexipInfo.isRemoteMuted);
                    return (
                        inHearingParticipants.length > 0 && allParticipantsMuted && (inHearingEndpoints.length === 0 || allEndpointsMuted)
                    );
                }),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Locking conference as all in-hearing participants are muted`);
                    this.videoCallService.muteAllParticipants(true, conference.id);
                })
            ),
        { dispatch: false }
    );

    unlockConferenceWhenAllInHearingParticipantsUnmuted$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.upsertPexipParticipant),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant),
                    this.store.select(ConferenceSelectors.getPexipConference)
                ]),
                filter(
                    ([_, conference, loggedInParticipant, pexipConference]) =>
                        !!conference &&
                        loggedInParticipant.status === ParticipantStatus.InHearing &&
                        loggedInParticipant.pexipInfo?.role === 'chair' &&
                        pexipConference.guestsMuted &&
                        conference.countdownComplete
                ),
                filter(([_, conference]) => {
                    const inHearingParticipants = conference.participants.filter(
                        p => p.status === ParticipantStatus.InHearing && ![Role.StaffMember, Role.Judge].includes(p.role)
                    );
                    const inHearingEndpoints = conference.endpoints.filter(e => e.status === EndpointStatus.InHearing);

                    const allParticipantsUnmuted = inHearingParticipants
                        .filter(p => p.status === ParticipantStatus.InHearing && !!p.pexipInfo)
                        .every(p => !p.pexipInfo.isRemoteMuted);
                    const allEndpointsUnmuted = inHearingEndpoints
                        .filter(e => e.status === EndpointStatus.InHearing && !!e.pexipInfo)
                        .every(e => !e.pexipInfo.isRemoteMuted);
                    return (
                        inHearingParticipants.length > 0 &&
                        allParticipantsUnmuted &&
                        (inHearingEndpoints.length === 0 || allEndpointsUnmuted)
                    );
                }),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Unlocking conference as all in-hearing participants are unmuted`);
                    this.videoCallService.muteAllParticipants(false, conference.id);
                })
            ),
        { dispatch: false }
    );

    /**
     * Some participants may still be remote muted when the conference is unlocked, this will unlock them
     */
    unlockAnyRemoteMutedParticipantsWhenConferenceGuestAreRemoteUnmuted$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.upsertPexipConference),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(
                    ([action, activeConference, loggedInParticipant]) =>
                        !action.pexipConference.guestsMuted &&
                        !!activeConference &&
                        !!loggedInParticipant &&
                        loggedInParticipant.pexipInfo?.role === 'chair'
                ),
                tap(([_, conference]) => {
                    this.logger.info(`${this.loggerPrefix} Unlocking any remote muted participants as conference is unlocked`);
                    conference.participants
                        .filter(p => p?.pexipInfo?.isRemoteMuted)
                        .forEach(p => this.videoCallService.muteParticipant(p.pexipInfo.uuid, false, conference.id, p.id));

                    conference.endpoints
                        .filter(e => e?.pexipInfo?.isRemoteMuted)
                        .forEach(e => this.videoCallService.muteParticipant(e.pexipInfo.uuid, false, conference.id, e.id));
                })
            ),
        { dispatch: false }
    );

    pauseAudioRecordingOnPauseOrSuspend$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateActiveConferenceStatus),
                concatLatestFrom(() => this.store.select(ConferenceSelectors.getActiveConference)),
                filter(
                    ([action, conference]) =>
                        !!conference &&
                        conference.id === action.conferenceId &&
                        (action.status === ConferenceStatus.Paused || action.status === ConferenceStatus.Suspended)
                ),
                tap(([_, _conference]) => {
                    this.audioRecordingService.cleanupDialOutConnections();
                })
            ),
        { dispatch: false }
    );

    refreshConferenceOnClose$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.updateActiveConferenceStatus),
            concatLatestFrom(() => this.store.select(ConferenceSelectors.getActiveConference)),
            filter(
                ([action, conference]) => !!conference && conference.id === action.conferenceId && action.status === ConferenceStatus.Closed
            ),
            switchMap(([action, _]) => {
                this.logger.info(`${this.loggerPrefix} Conference ${action.conferenceId} has been closed, refreshing conference`);
                return [ConferenceActions.loadConference({ conferenceId: action.conferenceId })];
            })
        )
    );

    private readonly loggerPrefix = '[ConferenceEffects] -';
    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private apiClient: ApiClient,
        private supplierClientService: SupplierClientService,
        private videoCallService: VideoCallService,
        private venueFlagService: HearingVenueFlagsService,
        private errorService: ErrorService,
        private eventsService: EventsService,
        private userMediaStreamService: UserMediaStreamServiceV2,
        private audioRecordingService: AudioRecordingService,
        private logger: Logger
    ) {}
}
