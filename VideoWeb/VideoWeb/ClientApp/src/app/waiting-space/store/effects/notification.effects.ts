import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { filter, first, tap } from 'rxjs/operators';
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
import { VHEndpoint, VHParticipant } from '../models/vh-conference';

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
                filter(
                    ([action, activeConference, loggedInParticipant]) =>
                        !!activeConference &&
                        !!loggedInParticipant &&
                        action.conferenceId === activeConference.id &&
                        action.status === ConferenceStatus.InSession &&
                        (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember)
                ),
                tap(([_action, activeConference, loggedInParticipant]) => {
                    // if the logged in participant is in a consultation and the hearing is in session
                    // and the participant role is staff member or judge, then show the notification
                    if (loggedInParticipant.status === ParticipantStatus.InConsultation) {
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
                        loggedInParticipant?.hearingRole !== HearingRole.EXPERT &&
                        (loggedInParticipant?.role === Role.Individual || loggedInParticipant?.role === Role.Representative)
                ),
                tap(([action, activeConference, loggedInParticipant]) => {
                    let hasWitnessLink = false;
                    if (loggedInParticipant.linkedParticipants.length > 0) {
                        const linkedParticipants = activeConference.participants.filter(p =>
                            loggedInParticipant.linkedParticipants.map(lp => lp.linkedId).includes(p.id)
                        );
                        hasWitnessLink = linkedParticipants.some(
                            p => p.hearingRole === HearingRole.WITNESS || p.hearingRole === HearingRole.EXPERT
                        );
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

    // create an effect to populate the previousParticipants array when LoadConferenceSuccess is dispatched
    resetParticipantList$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.loadConferenceSuccess),
                tap(action => {
                    this.previousParticipants = [...action.conference.participants];
                    this.previousEndpoints = [...action.conference.endpoints];
                })
            ),
        { dispatch: false }
    );

    participantAdded$ = createEffect(
        () => {
            // Initialize previousParticipants with current store value
            this.store
                .select(ConferenceSelectors.getParticipants)
                .pipe(
                    filter(x => !!x),
                    first()
                )
                .subscribe(participants => {
                    this.previousParticipants = [...participants];
                    this.logger.debug(`${this.loggerPrefix} Initialized previous participants:`, { participants });
                });

            return this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantList),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getParticipants),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(([_action, _currentParticipants, loggedInParticipant]) => !!loggedInParticipant),
                tap(([_action, currentParticipants, loggedInParticipant]) => {
                    const addedParticipants = currentParticipants.filter(
                        current => !this.previousParticipants.find(prev => prev.id === current.id)
                    );

                    this.logger.debug(`${this.loggerPrefix} Participant changes:`, {
                        previous: this.previousParticipants,
                        current: currentParticipants,
                        added: addedParticipants
                    });

                    addedParticipants.forEach(participant => {
                        this.toastNotificationService.showParticipantAdded(participant, this.isVideoOn(loggedInParticipant.status));
                    });

                    this.previousParticipants = [...currentParticipants];
                })
            );
        },
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
        () => {
            this.store
                .select(ConferenceSelectors.getEndpoints)
                .pipe(
                    filter(x => !!x),
                    first()
                )
                .subscribe(endpoints => {
                    this.previousEndpoints = [...endpoints];
                    this.logger.debug(`${this.loggerPrefix} Initialized previous endpoints:`, { endpoints });
                });

            return this.actions$.pipe(
                ofType(ConferenceActions.updateExistingEndpoints),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                filter(
                    ([action, conference, loggedInParticipant]) =>
                        !!loggedInParticipant && !!conference && conference.id === action.conferenceId
                ),
                tap(([action, _activeConference, loggedInParticipant]) => {
                    // for endpoints that have ids matched in previous endpoints, compare the name, external ref id and protectedFrom
                    // if any of them are different, show the notification
                    action.endpoints.forEach(endpoint => {
                        const previousEndpoint = this.previousEndpoints.find(prev => prev.id === endpoint.id);
                        if (previousEndpoint) {
                            if (
                                previousEndpoint.displayName !== endpoint.displayName ||
                                previousEndpoint.externalReferenceId !== endpoint.externalReferenceId ||
                                previousEndpoint.participantsLinked.length !== endpoint.participantsLinked.length ||
                                previousEndpoint.protectedFrom?.length !== endpoint.protectedFrom?.length
                            ) {
                                this.toastNotificationService.showEndpointUpdated(endpoint, this.isVideoOn(loggedInParticipant.status));
                                this.previousEndpoints = [...this.previousEndpoints.filter(prev => prev.id !== endpoint.id), endpoint];
                            }
                        }
                    });
                })
            );
        },
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

    previousParticipants: VHParticipant[] = [];
    previousEndpoints: VHEndpoint[] = [];
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
