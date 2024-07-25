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
                    // get participant or endpoint where action.participant.uuid === participant.pexipId
                    if (!participant && !endpoint) {
                        return;
                    }

                    // TODO: check if participant.interpreterLanguage is not null or endpoint.interpreterLanguage is not null
                    const hasInterpretationLanguage = true;
                    if (!hasInterpretationLanguage) {
                        return;
                    }

                    // const languageDescription = null;
                    // if (!languageDescription){
                    //     return;
                    // }

                    const participantUuid = participant ? participant.pexipInfo.uuid : endpoint.pexipInfo.uuid;
                    const languageDescription = 'Spanish';
                    const audioMixes: PexipAudioMix[] = [
                        {
                            mix_name: 'main',
                            prominent: false
                        },
                        {
                            mix_name: languageDescription,
                            prominent: true
                        }
                    ];
                    this.videoCallService.receiveAudioFromMix(languageDescription, participantUuid);
                    if (participant && participant.hearingRole === HearingRole.INTERPRETER) {
                        this.videoCallService.sendParticipantAudioToMixes(audioMixes, participantUuid);
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
