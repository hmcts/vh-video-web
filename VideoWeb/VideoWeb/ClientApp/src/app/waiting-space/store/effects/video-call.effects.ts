import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { Store } from '@ngrx/store';
import { VideoCallService } from '../../services/video-call.service';
import { HearingRole } from '../../models/hearing-role-model';
import { ApiClient, InterpreterType, ParticipantStatus, Role, Supplier } from 'src/app/services/clients/api-client';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { VideoCallActions } from '../actions/video-call.action';
import { EMPTY, of } from 'rxjs';
import { EventsService } from 'src/app/services/events.service';
import { UserMediaService } from 'src/app/services/user-media.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { ParticipantMediaStatus } from 'src/app/shared/models/participant-media-status';

@Injectable()
export class VideoCallEffects {
    createAudioMixes$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.createPexipParticipant),
                concatLatestFrom(action => [
                    this.launchDarklyService.getFlag<boolean>(FEATURE_FLAGS.interpreterEnhancements),
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getParticipantByPexipId(action.participant.uuid)),
                    this.store.select(ConferenceSelectors.getEndpointByPexipId(action.participant.uuid))
                ]),
                filter(
                    ([_action, interpreterEnhancementsEnabled, activeConference, _participant, _endpoint]) =>
                        activeConference?.supplier === Supplier.Vodafone && interpreterEnhancementsEnabled
                ),
                tap(([_, _activeConference, _flagEnabled, participant, endpoint]) => {
                    // filter non vh participant (i.e. countdown or wowza)
                    if (!participant && !endpoint) {
                        return;
                    }

                    // only need to set up audio mixes for if a participant has a verbal interpreter
                    const interpreterLanguage = participant ? participant.interpreterLanguage : endpoint.interpreterLanguage;
                    if (!interpreterLanguage || interpreterLanguage.type !== InterpreterType.Verbal) {
                        // defaults the participant to the 'main' stream
                        return;
                    }

                    // this represents both a participant and an endpoint
                    const participantUuid = participant ? participant.pexipInfo.uuid : endpoint.pexipInfo.uuid;
                    const mainCourtAudioMixName = 'main';
                    const languageAudioMixName = `main.${interpreterLanguage.description.toLowerCase()}`; // e.g. main.french or main.spanish
                    const isAnInterpreter = participant && participant.hearingRole === HearingRole.INTERPRETER;

                    if (isAnInterpreter) {
                        // send audio to main and to main.<language> (aka languageAudioMixName)
                        const audioMixes: PexipAudioMix[] = [
                            {
                                mix_name: mainCourtAudioMixName,
                                prominent: true
                            },
                            {
                                mix_name: languageAudioMixName,
                                prominent: false
                            }
                        ];
                        this.videoCallService.sendParticipantAudioToMixes(audioMixes, participantUuid);
                        this.videoCallService.receiveAudioFromMix(mainCourtAudioMixName, participantUuid);
                    } else {
                        // send audio to main court and to main.<language> (aka languageAudioMixName)
                        const audioMixes: PexipAudioMix[] = [
                            {
                                mix_name: mainCourtAudioMixName,
                                prominent: true
                            },
                            {
                                mix_name: languageAudioMixName,
                                prominent: true
                            }
                        ];
                        this.videoCallService.sendParticipantAudioToMixes(audioMixes, participantUuid);
                        this.videoCallService.receiveAudioFromMix(languageAudioMixName, participantUuid);
                    }
                })
            ),
        { dispatch: false }
    );

    updateAudioMixes$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.updateAudioMix),
                concatLatestFrom(action => [
                    this.launchDarklyService.getFlag<boolean>(FEATURE_FLAGS.interpreterEnhancements),
                    this.store.select(ConferenceSelectors.getParticipantByPexipId(action.participant.pexipInfo.uuid))
                ]),
                filter(([_action, interpreterEnhancementsEnabled, _participant]) => interpreterEnhancementsEnabled),
                tap(([action, _flagEnabled, participant]) => {
                    // filter non vh participant (i.e. countdown or wowza)
                    if (!participant) {
                        return;
                    }

                    const isAnInterpreter = participant && participant.hearingRole === HearingRole.INTERPRETER;
                    if (!isAnInterpreter) {
                        // only interpreters will have the means to change their audio mix
                        return;
                    }

                    const mainCourtAudioMixName = 'main';
                    const participantUuid = participant.pexipInfo.uuid;
                    let audioMixes: PexipAudioMix[];
                    if (action.mainCourt) {
                        audioMixes = [
                            {
                                mix_name: mainCourtAudioMixName,
                                prominent: true
                            }
                        ];
                        if (participant.interpreterLanguage) {
                            audioMixes.push({
                                mix_name: `main.${participant.interpreterLanguage.description.toLowerCase()}`,
                                prominent: false
                            });
                        }
                    } else if (action.interpreterLanguage) {
                        const languageAudioMixName = `main.${action.interpreterLanguage.description.toLowerCase()}`; // e.g. main.french or main.spanish
                        audioMixes = [
                            {
                                mix_name: mainCourtAudioMixName,
                                prominent: false
                            },
                            {
                                mix_name: languageAudioMixName,
                                prominent: true
                            }
                        ];
                    }

                    this.videoCallService.sendParticipantAudioToMixes(audioMixes, participantUuid);
                })
            ),
        { dispatch: false }
    );

    raiseHand$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallActions.raiseHand),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([_, activeConference, loggedInParticipant]) => {
                    this.logger.debug(`${this.loggerPrefix} Raising hand for participant ${loggedInParticipant.id}`);
                    this.videoCallService.raiseHand(activeConference.id, loggedInParticipant.id);
                })
            ),
        { dispatch: false }
    );

    lowerHand$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallActions.lowerHand),
                concatLatestFrom(() => [
                    this.store.select(ConferenceSelectors.getActiveConference),
                    this.store.select(ConferenceSelectors.getLoggedInParticipant)
                ]),
                tap(([_, activeConference, loggedInParticipant]) => {
                    this.logger.debug(`${this.loggerPrefix} Lowering hand for participant ${loggedInParticipant.id}`);
                    this.videoCallService.lowerHand(activeConference.id, loggedInParticipant.id);
                })
            ),
        { dispatch: false }
    );

    toggleAudioMute$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallActions.toggleAudioMute),
            concatLatestFrom(() => [
                this.store.select(ConferenceSelectors.getActiveConference),
                this.store.select(ConferenceSelectors.getLoggedInParticipant)
            ]),
            switchMap(([_, activeConference, loggedInParticipant]) => {
                this.logger.debug(`${this.loggerPrefix} Toggling audio mute for participant ${loggedInParticipant.id}`);
                const newMuteStatus = this.videoCallService.toggleMute(activeConference.id, loggedInParticipant.id);
                return [VideoCallActions.toggleAudioMuteSuccess({ participantId: loggedInParticipant.id, isMuted: newMuteStatus })];
            })
        )
    );

    toggleOutgoingVideo$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallActions.toggleOutgoingVideo),
            concatLatestFrom(() => [
                this.store.select(ConferenceSelectors.getActiveConference),
                this.store.select(ConferenceSelectors.getLoggedInParticipant)
            ]),
            switchMap(([_, activeConference, loggedInParticipant]) => {
                this.logger.debug(`${this.loggerPrefix} Toggling outgoing video for participant ${loggedInParticipant.id}`);
                const newVideoMuteStatus = this.videoCallService.toggleVideo(activeConference.id, loggedInParticipant.id);
                return [
                    VideoCallActions.toggleOutgoingVideoSuccess({ participantId: loggedInParticipant.id, isVideoOn: !newVideoMuteStatus })
                ];
            })
        )
    );

    publishOnAudioOrVideoToggle$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallActions.toggleOutgoingVideoSuccess, VideoCallActions.toggleAudioMuteSuccess),
            concatLatestFrom(() => [
                this.store.select(ConferenceSelectors.getActiveConference),
                this.store.select(ConferenceSelectors.getLoggedInParticipant)
            ]),
            switchMap(([_, activeConference, loggedInParticipant]) => {
                this.logger.debug(`${this.loggerPrefix} Requested to publish media status since audio or video was toggled`);
                return [
                    VideoCallActions.publishParticipantMediaDeviceStatus({
                        conferenceId: activeConference.id,
                        participantId: loggedInParticipant.id,
                        mediaStatus: {
                            isLocalAudioMuted: loggedInParticipant.localMediaStatus.isMicrophoneMuted,
                            isLocalVideoMuted: loggedInParticipant.localMediaStatus.isCameraOff
                        }
                    })
                ];
            })
        )
    );

    participantLeaveHearingRoom$ = createEffect(() =>
        this.actions$.pipe(
            ofType(VideoCallActions.participantLeaveHearingRoom),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            switchMap(([action, participant]) => {
                this.logger.debug(`${this.loggerPrefix} Participant ${participant.id} is attempting to leave the hearing room`);
                return this.apiClient.nonHostLeaveHearing(action.conferenceId).pipe(
                    map(() => VideoCallActions.participantLeaveHearingRoomSuccess({ conferenceId: action.conferenceId, participant })),
                    catchError(error => of(VideoCallActions.participantLeaveHearingRoomFailure({ error })))
                );
            })
        )
    );

    publishParticipantMediaDeviceStatus$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(VideoCallActions.publishParticipantMediaDeviceStatus),
                tap(action => {
                    this.logger.debug(`${this.loggerPrefix} Publishing media status for participant ${action.participantId}`);
                    this.eventService.sendMediaStatus(
                        action.conferenceId,
                        action.participantId,
                        new ParticipantMediaStatus(action.mediaStatus.isLocalAudioMuted, action.mediaStatus.isLocalVideoMuted)
                    );
                })
            ),
        { dispatch: false }
    );

    unmuteParticipantOnTransferToConsultationRoom$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.updateParticipantStatus),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            filter(
                ([action, loggedInParticipant]) =>
                    action.participantId === loggedInParticipant.id && action.status === ParticipantStatus.InConsultation
            ),
            switchMap(() => {
                const isMuted = this.videoCallService.pexipAPI.call?.mutedAudio;
                if (isMuted) {
                    this.logger.debug(`${this.loggerPrefix} Unmuting participant on transfer to consultation room`);
                    return [VideoCallActions.toggleAudioMute()];
                }
                return EMPTY;
            })
        )
    );

    muteParticipantOnTransferToHearingRoom$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.updateParticipantStatus),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            filter(
                ([action, loggedInParticipant]) =>
                    action.participantId === loggedInParticipant.id && action.status === ParticipantStatus.InHearing
            ),
            switchMap(() => {
                const isMuted = this.videoCallService.pexipAPI.call?.mutedAudio;
                if (!isMuted) {
                    this.logger.debug(`${this.loggerPrefix} Muting participant on transfer to hearing room`);
                    return [VideoCallActions.toggleAudioMute()];
                }
                return EMPTY;
            })
        )
    );

    localMuteParticipantOnRemoteMute$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.upsertPexipParticipant),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            filter(
                ([action, loggedInParticipant]) =>
                    loggedInParticipant.status === ParticipantStatus.InHearing &&
                    action.participant.uuid === loggedInParticipant?.pexipInfo.uuid
            ),
            switchMap(([action, loggedInParticipant]) => {
                const isRemoteMuted = action.participant.isRemoteMuted;
                const isLocalMuted = loggedInParticipant.localMediaStatus.isMicrophoneMuted;
                if (isRemoteMuted && !isLocalMuted) {
                    this.logger.debug(`${this.loggerPrefix} Muting participant on remote mute`);
                    return [VideoCallActions.toggleAudioMute()];
                }
                return EMPTY;
            })
        )
    );

    publishParticipantMediaDeviceStatusOnCountdownComplete$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.countdownComplete),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            filter(([_action, loggedInParticipant]) => loggedInParticipant.status === ParticipantStatus.InHearing),
            switchMap(([action, participant]) => {
                this.logger.debug(`${this.loggerPrefix} Publishing media status on countdown complete`);
                return [
                    VideoCallActions.publishParticipantMediaDeviceStatus({
                        conferenceId: action.conferenceId,
                        participantId: participant.id,
                        mediaStatus: {
                            isLocalAudioMuted: participant.localMediaStatus.isMicrophoneMuted,
                            isLocalVideoMuted: participant.localMediaStatus.isCameraOff
                        }
                    })
                ];
            })
        )
    );

    restoreHostMutePreferenceOnCountdownComplete$ = createEffect(() =>
        this.actions$.pipe(
            ofType(ConferenceActions.countdownComplete),
            concatLatestFrom(() => [this.store.select(ConferenceSelectors.getLoggedInParticipant)]),
            filter(
                ([_action, loggedInParticipant]) =>
                    (loggedInParticipant.role === Role.Judge || loggedInParticipant.role === Role.StaffMember) &&
                    loggedInParticipant.status === ParticipantStatus.InHearing
            ),
            switchMap(([action, _]) => {
                const startWithAudioMuted = this.userMediaService.getConferenceSetting(action.conferenceId)?.startWithAudioMuted ?? false;
                const isMuted = this.videoCallService.pexipAPI.call?.mutedAudio;
                if (isMuted && !startWithAudioMuted) {
                    this.logger.debug(`${this.loggerPrefix} Restoring host mute preference on countdown complete to unmute`);
                    return [VideoCallActions.toggleAudioMute()];
                }
                if (!isMuted && startWithAudioMuted) {
                    this.logger.debug(`${this.loggerPrefix} Restoring host mute preference on countdown complete to mute`);
                    return [VideoCallActions.toggleAudioMute()];
                }
                this.logger.debug(`${this.loggerPrefix} Host mute preference is already set correctly`);
                return EMPTY;
            })
        )
    );

    private readonly loggerPrefix = '[VideoCallEffect] -';

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private videoCallService: VideoCallService,
        private launchDarklyService: LaunchDarklyService,
        private apiClient: ApiClient,
        private eventService: EventsService,
        private userMediaService: UserMediaService,
        private logger: Logger
    ) {}
}
