import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Logger } from 'src/app/services/logging/logger-base';
import { pageUrls } from '../page-url.constants';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private injector: Injector, private zone: NgZone) {}

    handleError(err: any) {
        const router: Router = this.injector.get(Router);
        const logger: Logger = this.injector.get(Logger);

        err = this.unboxRejection(err);
        logger.error('Unexpected error', err);

        if (this.isUnauthorized(err)) {
            logger.error('User is not authorized - 401', err, { url: router.url });
            this.redirectTo(router, pageUrls.Unauthorised);
        } else {
            logger.error('Unhandled error occured', err, { url: router.url });
            this.redirectTo(router, pageUrls.ServiceError);
        }
    }

    public redirectTo(router: Router, page: string): any {
        // handle error executes outside of the angular zone so we need to force it back in to do the redirection correctly
        this.zone.run(() => router.navigate([page]));
    }

    private unboxRejection(err: any): any {
        // if the error is thrown through a promise, we can unbox the actual error this way
        return err.rejection || err;
    }

    private isUnauthorized(err) {
        return err.status && (err.status === 401 || err.status === 403);
    }
}
