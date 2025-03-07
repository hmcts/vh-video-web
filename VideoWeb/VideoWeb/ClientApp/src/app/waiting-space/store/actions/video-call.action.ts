import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { VHParticipant, VHParticipantMediaStatus } from '../models/vh-conference';

/* eslint-disable @typescript-eslint/naming-convention */
export const VideoCallActions = createActionGroup({
    source: 'VideoCall',
    events: {
        'Raise Hand': emptyProps(), // pexip setBuzz
        'Raise Hand Success': props<{ conferenceId: string; participantId: string }>(), // using to create an effect to publish hand status. don't think we need this anymore
        'Lower Hand': emptyProps(), // pexip clearBuzz
        'Lower Hand Success': props<{ conferenceId: string; participantId: string }>(), // using to create an effect to publish hand status. don't think we need this anymore

        'Toggle Audio Mute': emptyProps(), // pexip's toggle mute
        'Toggle Audio Mute Success': props<{ participantId: string; isMuted: boolean }>(),

        'Toggle Outgoing Video': emptyProps(), // pexip's toggle video
        'Toggle Outgoing Video Success': props<{ participantId: string; isVideoOn: boolean }>(),

        'Participant Leave HearingRoom': props<{ conferenceId: string }>(),
        'Participant Leave HearingRoom Success': props<{ conferenceId: string; participant: VHParticipant }>(),
        'Participant Leave HearingRoom Failure': props<{ error: Error }>(),

        'Publish Participant Media Device Status': props<{
            conferenceId: string;
            participantId: string;
            mediaStatus: VHParticipantMediaStatus;
        }>()
    }
});
