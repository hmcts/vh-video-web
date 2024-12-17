import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';

import * as ConferenceSelectors from '../selectors/conference.selectors';
import { ParticipantStatus, Role } from 'src/app/services/clients/api-client';

@Injectable()
export class NotificationEffects {
    participantLeaveHearingRoomSuccess$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.participantLeaveHearingRoomSuccess),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
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

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private toastNotificationService: NotificationToastrService
    ) {}

    isVideoOn(status: ParticipantStatus): boolean {
        return status === ParticipantStatus.InHearing || status === ParticipantStatus.InConsultation;
    }
}
