import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { delay, filter, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { ConsultationService } from 'src/app/services/api/consultation.service';

import { ConsultationAnswer, ParticipantStatus } from 'src/app/services/clients/api-client';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { ConsultationInvitationService } from '../../services/consultation-invitation.service';
import { concatLatestFrom } from '@ngrx/operators';

@Injectable()
export class ConsultationEffects {
    consultationResponded$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.consultationResponded),
            delay(10000), // Delay for 10 seconds
            filter(action => action.answer !== ConsultationAnswer.Transferring),
            switchMap(action =>
                of(
                    ConferenceActions.clearConsultationCallStatus({
                        invitationId: action.invitationId,
                        requestedFor: action.requestedFor
                    })
                )
            )
        )
    );

    getRequestedConsultationMessage$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.consultationRequested),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getLoggedInParticipant),
                    this.store.select(ConferenceSelectors.getActiveConference)
                ]),
                filter(
                    ([action, loggedInParticipant, activeConference]) =>
                        !!activeConference &&
                        !!loggedInParticipant &&
                        action.conferenceId === activeConference?.id &&
                        action.requestedFor === loggedInParticipant.id &&
                        loggedInParticipant.status !== ParticipantStatus.InHearing
                ),
                tap(([action, participant, conference]) => {
                    const requestedBy = conference.participants.find(p => p.id === action.requestedBy);
                    const roomParticipants = conference.participants.filter(p => p.room?.label === action.roomLabel);
                    const roomEndpoints = conference.endpoints.filter(e => e.room?.label === action.roomLabel);

                    const invitation = this.consultationInvitationService.getInvitation(action.roomLabel);
                    invitation.invitationId = action.invitationId;
                    invitation.invitedByName = requestedBy.displayName;

                    // if the invitation has already been accepted; resend the response with the updated invitation id
                    if (invitation.answer === ConsultationAnswer.Accepted) {
                        this.consultationService.respondToConsultationRequest(
                            action.conferenceId,
                            action.invitationId,
                            action.requestedBy,
                            action.requestedFor,
                            invitation.answer,
                            action.roomLabel
                        );
                    }

                    if (invitation.answer !== ConsultationAnswer.Accepted) {
                        invitation.answer = ConsultationAnswer.None;
                        const consultationInviteToast = this.notificationToastrService.showConsultationInvite(
                            action.roomLabel,
                            action.conferenceId,
                            invitation,
                            requestedBy,
                            participant,
                            roomParticipants,
                            roomEndpoints,
                            participant.status !== ParticipantStatus.Available
                        );

                        if (consultationInviteToast) {
                            invitation.activeToast = consultationInviteToast;
                        }
                    }

                    for (const linkedParticipant of participant.linkedParticipants) {
                        if (invitation.linkedParticipantStatuses[linkedParticipant.linkedId] === undefined) {
                            invitation.linkedParticipantStatuses[linkedParticipant.linkedId] = false;
                        }
                    }
                })
            ),
        { dispatch: false }
    );

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private notificationToastrService: NotificationToastrService,
        private consultationService: ConsultationService,
        private consultationInvitationService: ConsultationInvitationService
    ) {}
}
