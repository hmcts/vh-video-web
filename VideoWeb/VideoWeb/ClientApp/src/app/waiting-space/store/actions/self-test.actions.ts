import { createActionGroup, props } from '@ngrx/store';
import { SelfTestFailureReason, TestCallScoreResponse } from 'src/app/services/clients/api-client';

/* eslint-disable @typescript-eslint/naming-convention */
export const SelfTestActions = createActionGroup({
    source: 'SelfTest',
    events: {
        'Retrieve Self Test Score': props<{ conferenceId: string; participantId: string; independent: boolean }>(),
        'Retrieve Self Test Score Success': props<{ score: TestCallScoreResponse; participantId: string }>(),
        'Publish Self Test Failure': props<{ conferenceId: string; reason: SelfTestFailureReason }>()
    }
});
