import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { tap } from 'rxjs/operators';
import { ConferenceActions } from '../actions/conference.actions';
import { ConferenceState } from '../reducers/conference.reducer';
import * as ConferenceSelectors from '../selectors/conference.selectors';
import { Store } from '@ngrx/store';
import { VideoCallService } from '../../services/video-call.service';
import { HearingRole } from '../../models/hearing-role-model';
import { InterpreterType } from 'src/app/services/clients/api-client';

@Injectable()
export class VideoCallEffects {
    createAudioMixes$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType(ConferenceActions.createPexipParticipant),
                concatLatestFrom(action => [
                    this.store.select(ConferenceSelectors.getParticipantByPexipId(action.participant.uuid)),
                    this.store.select(ConferenceSelectors.getEndpointByPexipId(action.participant.uuid))
                ]),
                tap(([action, participant, endpoint]) => {
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

    constructor(
        private actions$: Actions,
        private store: Store<ConferenceState>,
        private videoCallService: VideoCallService
    ) {}
}
