import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { VHInterpreterLanguage } from '../models/vh-conference';

/* eslint-disable @typescript-eslint/naming-convention */
export const ReferenceActions = createActionGroup({
    source: 'Reference',
    events: {
        'Load Interpreter Languages': emptyProps(),
        'Load Interpreter Languages Success': props<{ languages: VHInterpreterLanguage[] }>(),
        'Load Interpreter Languages Failure': props<{ error: Error }>()
    }
});
