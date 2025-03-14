import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { filter, pairwise, tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';

import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { TransferDirection } from 'src/app/services/models/hearing-transfer';
import { NotificationSoundsService } from '../../services/notification-sounds.service';
import { HearingRole } from '../../models/hearing-role-model';
import { VideoCallActions } from '../actions/video-call.action';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable()
export class NotificationEffects {
    hearingStartedByAnotherHost$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateActiveConferenceStatus),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([_action, activeConference, loggedInParticipant]) => {
                    // if the logged in participant is in a consultation and the hearing is in session
                    // and the participant role is staff member or judge, then show the notification
                    if (
                        activeConference.status === ConferenceStatus.InSession &&
                        loggedInParticipant.status === ParticipantStatus.InConsultation &&
                        (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember)
                    ) {
                        this.toastNotificationService.showHearingStarted(activeConference.id, loggedInParticipant.id);
                    }
                })
            ),
        { dispatch: false }
    );

    hearingStartingJudicialOfficeHolder$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateActiveConferenceStatus),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(
                    ([action, activeConference, loggedInParticipant]) =>
                        action.conferenceId === activeConference?.id && loggedInParticipant?.role === Role.JudicialOfficeHolder
                ),
                tap(([action]) => {
                    if (action.status === ConferenceStatus.InSession) {
                        this.notificationSoundsService.playHearingAlertSound();
                    } else {
                        this.notificationSoundsService.stopHearingAlertSound();
                    }
                })
            ),
        { dispatch: false }
    );

    hearingStartingNonJudicialOfficeHolder$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateActiveConferenceStatus),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(
                    ([action, activeConference, loggedInParticipant]) =>
                        !!activeConference &&
                        !!loggedInParticipant &&
                        action.conferenceId === activeConference?.id &&
                        loggedInParticipant?.hearingRole !== HearingRole.WITNESS &&
                        (loggedInParticipant?.role === Role.Individual || loggedInParticipant?.role === Role.Representative)
                ),
                tap(([action, activeConference, loggedInParticipant]) => {
                    let hasWitnessLink = false;
                    if (loggedInParticipant.linkedParticipants.length > 0) {
                        const linkedParticipants = activeConference.participants.filter(p =>
                            loggedInParticipant.linkedParticipants.map(lp => lp.linkedId).includes(p.id)
                        );
                        hasWitnessLink = linkedParticipants.some(p => p.hearingRole === HearingRole.WITNESS);
                    }

                    const isQuickLinkUser =
                        loggedInParticipant.hearingRole === HearingRole.QUICK_LINK_PARTICIPANT ||
                        loggedInParticipant.hearingRole === HearingRole.QUICK_LINK_OBSERVER;

                    if (action.status === ConferenceStatus.InSession && !hasWitnessLink && !isQuickLinkUser) {
                        this.notificationSoundsService.playHearingAlertSound();
                    } else {
                        this.notificationSoundsService.stopHearingAlertSound();
                    }
                })
            ),
        { dispatch: false }
    );

    participantLeaveHearingRoomSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallActions.participantLeaveHearingRoomSuccess),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(([action, activeConference, loggedInParticipant]) => !!activeConference && !!loggedInParticipant),
                tap(([action, activeConference, loggedInParticipant]) => {
                    const isHost = loggedInParticipant?.role === Role.Judge || loggedInParticipant?.role === Role.StaffMember;
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }
                    if (!isHost) {
                        return;
                    }

                    this.toastNotificationService.showParticipantLeftHearingRoom(
                        action.participant,
                        loggedInParticipant.status === ParticipantStatus.InConsultation ||
                            loggedInParticipant.status === ParticipantStatus.InHearing
                    );
                })
            ),
        { dispatch: false }
    );

    participantAdded$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantList),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getParticipants).pipe(pairwise()),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, [previousParticipants, _], loggedInParticipant]) => {
                    const newParticipants = action.participants.filter(x => !previousParticipants.find(y => y.id === x.id));
                    newParticipants.forEach(participant => {
                        this.logger.debug(`${this.loggerPrefix} participant added, showing notification`, participant);

                        this.toastNotificationService.showParticipantAdded(participant, this.isVideoOn(loggedInParticipant.status));
                    });
                })
            ),
        { dispatch: false }
    );

    endpointsAdded$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.addNewEndpoints),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }

                    const videoOn = this.isVideoOn(loggedInParticipant.status);
                    action.endpoints.forEach(endpoint => {
                        this.toastNotificationService.showEndpointAdded(endpoint, videoOn);
                    });
                })
            ),
        { dispatch: false }
    );

    endpointsUpdated$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateExistingEndpoints),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }

                    const videoOn = this.isVideoOn(loggedInParticipant.status);
                    action.endpoints.forEach(endpoint => {
                        this.toastNotificationService.showEndpointUpdated(endpoint, videoOn);
                    });
                })
            ),
        { dispatch: false }
    );

    endpointLinkUpdated$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.linkParticipantToEndpoint),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }

                    const videoOn = this.isVideoOn(loggedInParticipant.status);
                    this.toastNotificationService.showEndpointLinked(action.endpoint, videoOn);
                })
            ),
        { dispatch: false }
    );

    endpointUnlinked$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.unlinkParticipantFromEndpoint),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }

                    const videoOn = this.isVideoOn(loggedInParticipant.status);
                    this.toastNotificationService.showEndpointUnlinked(action.endpoint, videoOn);
                })
            ),
        { dispatch: false }
    );

    closeConsultationBetweenEndpointAndParticipant$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.closeConsultationBetweenEndpointAndParticipant),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    if (activeConference.id !== action.conferenceId) {
                        return;
                    }

                    const videoOn = this.isVideoOn(loggedInParticipant.status);
                    this.toastNotificationService.showEndpointConsultationClosed(action.endpoint, videoOn);
                })
            ),
        { dispatch: false }
    );

    hearingLayoutChanged$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.hearingLayoutChanged),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([action, activeConference, loggedInParticipant]) => {
                    if (
                        activeConference.id !== action.conferenceId ||
                        (loggedInParticipant.role !== Role.Judge && loggedInParticipant.role !== Role.StaffMember)
                    ) {
                        return;
                    }

                    const changedBy = activeConference.participants.find(x => x.id === action.changedById);
                    if (changedBy.id === loggedInParticipant.id) {
                        return;
                    }
                    const videoOn = this.isVideoOn(loggedInParticipant.status);
                    this.toastNotificationService.showHearingLayoutchanged(changedBy, videoOn);
                })
            ),
        { dispatch: false }
    );

    participantTransferringIn$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantHearingTransferStatus),
                concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
                tap(([action, participant]) => {
                    if (participant?.id !== action.participantId) {
                        return;
                    }

                    if (action.transferDirection === TransferDirection.In) {
                        this.notificationSoundsService.playHearingAlertSound();
                    }
                })
            ),
        { dispatch: false }
    );

    private readonly loggerPrefix = '[NotificationEffects] -';

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private toastNotificationService: NotificationToastrService,
        private notificationSoundsService: NotificationSoundsService,
        private logger: Logger
    ) {}

    isVideoOn(status: ParticipantStatus): boolean {
        return status === ParticipantStatus.InHearing || status === ParticipantStatus.InConsultation;
    }
}
