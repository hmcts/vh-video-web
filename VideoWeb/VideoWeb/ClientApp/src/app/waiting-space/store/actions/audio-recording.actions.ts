import { createActionGroup, props } from '@ngrx/store';

export const AudioRecordingActions = createActionGroup({
    source: 'AudioRecording',
    events: {
        'Pause Audio Recording': props<{ conferenceId: string }>(),
        'Pause Audio Recording Success': props<{ conferenceId: string }>(),
        'Resume Audio Recording': props<{ conferenceId: string }>(),
        'Resume Audio Recording Success': props<{ conferenceId: string }>(),
        'Resume Audio Recording Failure': props<{ conferenceId: string }>(),
        'Continue Hearing Without Audio Recording': props<{ conferenceId: string; continueWithouRecording: boolean }>(),
        'Audio Recording Restarted': props<{ conferenceId: string }>(),
        'Audio Recording Restarted Success': props<{ conferenceId: string }>(),
        'Audio Recording Restarted Failure': props<{ conferenceId: string }>()
    }
});
