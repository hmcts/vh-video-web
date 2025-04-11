import { Injectable } from '@angular/core';
import { ofType, createEffect, Actions } from '@ngrx/effects';
import { switchMap, map, shareReplay } from 'rxjs/operators';
import { ApiClient } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { AuthActions } from '../actions/auth.actions';

@Injectable()
export class AuthEffects {
    loadUserProfile$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.loadUserProfile),
            switchMap(_action =>
                this.apiClient.getUserProfile().pipe(
                    shareReplay(1),
                    map(profile => {
                        this.logger.info(`${this.loggerPrefix} Loaded user profile`, { profile });
                        return AuthActions.loadUserProfileSuccess({
                            userProfile: {
                                roles: profile.roles,
                                firstName: profile.first_name,
                                lastName: profile.last_name,
                                displayName: profile.display_name,
                                username: profile.username,
                                name: profile.name
                            }
                        });
                    })
                )
            )
        )
    );
    private readonly loggerPrefix = '[AuthEffects] -';
    constructor(
        private actions$: Actions,
        private apiClient: ApiClient,
        private logger: Logger
    ) {}
}
