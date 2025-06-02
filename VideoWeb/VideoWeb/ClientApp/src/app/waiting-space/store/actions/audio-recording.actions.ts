import { createActionGroup, props } from '@ngrx/store';

/* eslint-disable @typescript-eslint/naming-convention */
export const AudioRecordingActions = createActionGroup({
    source: 'AudioRecording',
    events: {
        'Pause Audio Recording': props<{ conferenceId: string }>(),
        'Pause Audio Recording Success': props<{ conferenceId: string }>(),
        'Resume Audio Recording': props<{ conferenceId: string }>(),
        'Resume Audio Recording Success': props<{ conferenceId: string }>(),
        'Resume Audio Recording Failure': props<{ conferenceId: string }>(),
        'Audio Recording Verification Failed': props<{ conferenceId: string }>(),
        'Restart Audio Recording': props<{ conferenceId: string }>(),
        'Audio Recording Restarted': props<{ conferenceId: string }>()
    }
});
