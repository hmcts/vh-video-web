import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { HearingLayout } from 'src/app/services/clients/api-client';

/* eslint-disable @typescript-eslint/naming-convention */
export const VideoCallHostActions = createActionGroup({
    source: 'VideoCall',
    events: {
        'Lower Participant Hand': props<{ participantId: string }>(),
        'Lower All Participant Hands': emptyProps(),
        'Mute Participant': props<{ participantId: string }>(),
        'Unmute Participant': props<{ participantId: string }>(),
        'Update Participant Spotlight': props<{ participantId: string; isSpotlighted: boolean }>(),
        'Update All Participants Mute': props<{ isMuted: boolean }>(),

        'Start Hearing': props<{ conferenceId: string; hearingLayout: HearingLayout }>(),
        'Start Hearing Success': emptyProps(),
        'Start Hearing Failure': props<{ error: Error }>(),

        'Pause Hearing': props<{ conferenceId: string }>(),
        'Pause Hearing Success': emptyProps(),
        'Pause Hearing Failure': props<{ error: Error }>(),

        'Suspend Hearing': props<{ conferenceId: string }>(),
        'Suspend Hearing Success': emptyProps(),
        'Suspend Hearing Failure': props<{ error: Error }>(),

        'End Hearing': props<{ conferenceId: string }>(),
        'End Hearing Success': emptyProps(),
        'End Hearing Failure': props<{ error: Error }>(),

        'Host Leave Hearing': props<{ conferenceId: string; participantId: string }>(),
        'Host Leave Hearing Success': emptyProps(),
        'Host Leave Hearing Failure': props<{ error: Error }>(),

        'Join Hearing': props<{ conferenceId: string; participantId: string }>(),
        'Join Hearing Success': emptyProps(),
        'Join Hearing Failure': props<{ error: Error }>(),

        'Admit Participant': props<{ conferenceId: string; participantId: string }>(),
        'Admit Participant Success': emptyProps(),
        'Admit Participant Failure': props<{ error: Error }>(),

        'Dismiss Participant': props<{ conferenceId: string; participantId: string }>(),
        'Dismiss Participant Success': emptyProps(),
        'Dismiss Participant Failure': props<{ error: Error }>()
    }
});
