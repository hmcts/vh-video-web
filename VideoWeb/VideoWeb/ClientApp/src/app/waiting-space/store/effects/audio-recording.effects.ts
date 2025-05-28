import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { EMPTY, from, NEVER } from 'rxjs';
import { map, tap, filter, switchMap } from 'rxjs/operators';
import { Logger } from 'src/app/services/logging/logger-base';
import { AudioRecordingActions } from '../actions/audio-recording.actions';
import { AudioRecordingService } from 'src/app/services/audio-recording.service';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { ConferenceState } from '../reducers/conference.reducer';
import { getActiveConference, getAudioRecordingState, getLoggedInParticipant } from '../selectors/conference.selectors';
import { ConferenceStatus, ParticipantStatus, Role } from 'src/app/services/clients/api-client';
import { NotificationToastrService } from '../../services/notification-toastr.service';
import { ConferenceActions } from '../actions/conference.actions';
import { EventsService } from 'src/app/services/events.service';
import { VhToastComponent } from 'src/app/shared/toast/vh-toast.component';

@Injectable()
export class AudioRecordingEffects {
    verifyAudioRecordingOnCountdownComplete$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.countdownComplete),
            concatLatestFrom(() => [
                this.store.select(getActiveConference),
                this.store.select(getLoggedInParticipant),
                this.store.select(getAudioRecordingState)
            ]),
            filter(([action, conference, _loggedInParticipant, _audioRecordingState]) => action.conferenceId === conference.id),
            switchMap(([_, conference, loggedInParticipant, audioRecordingState]) => {
                if (
                    (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember) &&
                    loggedInParticipant.status === ParticipantStatus.InHearing &&
                    conference.audioRecordingRequired &&
                    !audioRecordingState.continueWithoutRecording &&
                    !audioRecordingState.restartNotificationDisplayed &&
                    !audioRecordingState.wowzaConnectedAsAudioOnly
                ) {
                    this.logger.warn(
                        `${this.loggerPrefix} not recording when expected, streaming agent could not establish connection: show alert`,
                        {
                            participantRole: loggedInParticipant.role,
                            participantStatus: loggedInParticipant.status,
                            audioRequired: conference.audioRecordingRequired,
                            continueWithoutRecording: audioRecordingState.continueWithoutRecording,
                            restartNotificationDisplayed: audioRecordingState.restartNotificationDisplayed,
                            wowzaConnectedAsAudioOnly: audioRecordingState.wowzaConnectedAsAudioOnly
                        }
                    );
                    return [AudioRecordingActions.audioRecordingVerificationFailed({ conferenceId: conference.id })];
                } else {
                    return NEVER;
                }
            })
        )
    );

    displayRestartRecordingNotification$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.audioRecordingVerificationFailed),
                concatLatestFrom(() => [this.store.select(getActiveConference), this.store.select(getLoggedInParticipant)]),
                filter(
                    ([action, conference, loggedInParticipant]) =>
                        !!conference &&
                        !!loggedInParticipant &&
                        action.conferenceId === conference.id &&
                        conference.countdownComplete &&
                        loggedInParticipant.status === ParticipantStatus.InHearing &&
                        (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember)
                ),
                tap(([_action, conference, _loggedInParticipant]) => {
                    this.logger.info(`${this.loggerPrefix} Audio recording verification failed, showing notification`);
                    this.restartToastNotification = this.notificationToastrService.showAudioRecordingErrorWithRestart(() => {
                        this.store.dispatch(
                            AudioRecordingActions.restartAudioRecording({
                                conferenceId: conference.id
                            })
                        );
                    });
                })
            ),
        { dispatch: false }
    );

    removeRestartRecordingNotification$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.audioRecordingRestarted),
                concatLatestFrom(() => [this.store.select(getActiveConference)]),
                filter(([action, conference]) => this.restartToastNotification && action.conferenceId === conference.id),
                tap(([_action, _conference]) => {
                    this.logger.info(`${this.loggerPrefix} Audio recording restarted, clearing notification`);
                    this.restartToastNotification?.remove();
                    this.restartToastNotification = null;
                })
            ),
        { dispatch: false }
    );

    pauseAudioRecording$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.pauseAudioRecording),
                concatLatestFrom(() => [
                    this.store.select(getAudioRecordingState),
                    this.store.select(getActiveConference),
                    this.store.select(getLoggedInParticipant)
                ]),
                filter(
                    ([action, audioRecording, conference, loggedInParticipant]) =>
                        (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember) &&
                        action.conferenceId === conference.id &&
                        !audioRecording.recordingPaused &&
                        audioRecording.wowzaConnectedAsAudioOnly &&
                        conference.countdownComplete
                ),
                tap(_ =>
                    from(this.audioRecordingService.stopRecording()).pipe(
                        map(() => {
                            this.logger.info(`${this.loggerPrefix} Audio recording paused requested`);
                            return EMPTY;
                        })
                    )
                )
            ),
        { dispatch: false }
    );

    displayResumeFailureRecordingNotification$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.resumeAudioRecordingFailure),
                concatLatestFrom(() => [this.store.select(getActiveConference), this.store.select(getLoggedInParticipant)]),
                filter(
                    ([action, conference, loggedInParticipant]) =>
                        action.conferenceId === conference.id && loggedInParticipant.status === ParticipantStatus.InHearing
                ),
                tap(() => {
                    this.logger.info(`${this.loggerPrefix} Audio recording resume failed, showing notification`);
                    this.restartFailureToastNotification = this.notificationToastrService.showAudioRecordingRestartFailure();
                })
            ),
        { dispatch: false }
    );

    displayResumeSuccessRecordingNotification$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.resumeAudioRecordingSuccess),
                concatLatestFrom(() => [this.store.select(getActiveConference), this.store.select(getLoggedInParticipant)]),
                filter(
                    ([action, conference, loggedInParticipant]) =>
                        action.conferenceId === conference.id &&
                        conference.countdownComplete &&
                        loggedInParticipant.status === ParticipantStatus.InHearing
                ),
                tap(() => {
                    this.logger.info(`${this.loggerPrefix} Audio recording resumed, showing notification`);
                    this.restartSuccessToastNotification = this.notificationToastrService.showAudioRecordingRestartSuccess();
                })
            ),
        { dispatch: false }
    );

    restartAudioRecording$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.restartAudioRecording),
                concatLatestFrom(() => [this.store.select(getActiveConference), this.store.select(getLoggedInParticipant)]),
                filter(
                    ([action, conference, loggedInParticipant]) =>
                        !!loggedInParticipant &&
                        !!conference &&
                        (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember) &&
                        action.conferenceId === conference.id &&
                        conference.status === ConferenceStatus.InSession
                ),
                tap(([_action, conference, loggedInParticipant]) => {
                    this.audioRecordingService.cleanupDialOutConnections();
                    // reconnect here because resume effect only triggers if wowza has been paused. maybe move this into an effect?
                    this.audioRecordingService.reconnectToWowza();
                    // trigger restart action for logged in user
                    this.store.dispatch(AudioRecordingActions.audioRecordingRestarted({ conferenceId: conference.id }));
                    // use events service to inform other hosts a restart is in progress
                    this.eventsService.sendAudioRestartActioned(conference.id, loggedInParticipant.id);
                })
            ),
        { dispatch: false }
    );

    resumeAudioRecording$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(AudioRecordingActions.resumeAudioRecording),
                concatLatestFrom(() => [
                    this.store.select(getAudioRecordingState),
                    this.store.select(getActiveConference),
                    this.store.select(getLoggedInParticipant)
                ]),
                filter(
                    ([action, audioRecording, conference, loggedInParticipant]) =>
                        !!loggedInParticipant &&
                        !!conference &&
                        (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember) &&
                        action.conferenceId === conference.id &&
                        conference.status === ConferenceStatus.InSession &&
                        audioRecording.recordingPaused &&
                        !audioRecording.wowzaConnectedAsAudioOnly
                ),
                tap(() => this.audioRecordingService.reconnectToWowza())
            ),
        { dispatch: false }
    );

    clearAudioNotificationsOnTransferToWaitingRoom$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateParticipantRoom),
                concatLatestFrom(() => [this.store.select(getLoggedInParticipant)]),
                filter(
                    ([action, loggedInParticipant]) => action.participantId === loggedInParticipant.id && action.toRoom === 'WaitingRoom'
                ),
                tap(() => {
                    this.logger.info(`${this.loggerPrefix} Audio recording transfer to waiting room, clearing notifications`);
                    this.restartToastNotification?.remove();
                    this.restartToastNotification = null;
                    this.restartSuccessToastNotification?.remove();
                    this.restartSuccessToastNotification = null;
                    this.restartFailureToastNotification?.remove();
                    this.restartFailureToastNotification = null;
                })
            ),
        { dispatch: false }
    );

    restartToastNotification: VhToastComponent;
    restartSuccessToastNotification: VhToastComponent;
    restartFailureToastNotification: VhToastComponent;

    private readonly loggerPrefix = '[AudioRecordingEffects] -';

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private audioRecordingService: AudioRecordingService,
        private eventsService: EventsService,
        private notificationToastrService: NotificationToastrService,
        private logger: Logger
    ) {}
}
