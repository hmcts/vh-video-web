import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { filter, tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { Store } from '@ngrx/store';
import { VideoCallService } from '../../services/video-call.service';
import { HearingRole } from '../../models/hearing-role-model';
import { InterpreterType, Supplier } from 'src/app/services/clients/api-client';
import { FEATURE_FLAGS, LaunchDarklyService } from 'src/app/services/launch-darkly.service';

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
                tap(([action, _activeConference, _flagEnabled, participant, endpoint]) => {
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

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private videoCallService: VideoCallService,
        private launchDarklyService: LaunchDarklyService
    ) {}
}
