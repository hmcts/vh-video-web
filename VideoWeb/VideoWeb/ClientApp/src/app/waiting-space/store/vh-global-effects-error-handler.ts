import { Injectable, ErrorHandler } from '@angular/core';
import { Observable } from 'rxjs';
import { EffectsErrorHandler } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { catchError } from 'rxjs/operators';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable()
export class VHGlobalEffectsErrorHandler {
    constructor(private logger: Logger) {}

    handle: EffectsErrorHandler = <T extends Action>(observable$: Observable<T>, errorHandler: ErrorHandler): Observable<T> => {
        return observable$.pipe(
            catchError((error, caught) => {
                this.logger.error('[VHGlobalEffectsErrorHandler] - Unhandled error in effect:\n', error);
                errorHandler.handleError(error);
                return caught;
            })
        );
    };
}
