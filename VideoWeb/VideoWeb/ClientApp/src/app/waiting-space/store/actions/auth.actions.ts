import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserProfile } from '../models/user-profile';

/* eslint-disable @typescript-eslint/naming-convention */
export const AuthActions = createActionGroup({
    source: 'AuthActions',
    events: {
        'Load User Profile': emptyProps(),
        'Load User Profile Success': props<{ userProfile: UserProfile }>()
    }
});
