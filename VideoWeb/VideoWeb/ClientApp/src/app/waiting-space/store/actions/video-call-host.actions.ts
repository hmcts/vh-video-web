import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { HearingLayout } from 'src/app/services/clients/api-client';

/* eslint-disable @typescript-eslint/naming-convention */
export const VideoCallHostActions = createActionGroup({
    source: 'VideoCallHost',
    events: {
        // Top Level Panel List Controls
        'Local Mute All Participants': emptyProps(),
        'Local Unmute All Participants': emptyProps(),

        'Remote Mute And Lock All Participants': emptyProps(),
        'Unlock Remote Mute': emptyProps(),

        'Lower All Participant Hands': emptyProps(),

        // Context Menu actions
        'Unlock Remote Mute For Participant': props<{ participantId: string }>(),
        'Lock Remote Mute For Participant': props<{ participantId: string }>(),
        'Lower Participant Hand': props<{ participantId: string }>(),
        'Local Mute Participant': props<{ participantId: string }>(),
        'Local Unmute Participant': props<{ participantId: string }>(),
        'Spotlight Participant': props<{ participantId: string }>(),
        'Remove Spotlight For Participant': props<{ participantId: string }>(),

        'Admit Participant': props<{ participantId: string }>(),
        'Admit Participant Success': emptyProps(),
        'Admit Participant Failure': props<{ error: Error; participantId: string; conferenceId: string }>(),

        'Dismiss Participant': props<{ participantId: string }>(),
        'Dismiss Participant Success': emptyProps(),
        'Dismiss Participant Failure': props<{ error: Error }>(),

        // Conference Management actions
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
        'Join Hearing Failure': props<{ error: Error }>()
    }
});
