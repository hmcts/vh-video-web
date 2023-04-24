import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
// import { Logger } from 'src/app/services/logging/logger-base';
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private injector: Injector) {}

    handleError(err: any) {
        const logger: Logger = this.injector.get(Logger);

        err = this.unboxRejection(err);
        logger.error('Unexpected error', err);
    }

    private unboxRejection(err: any): any {
        // if the error is thrown through a promise, we can unbox the actual error this way
        return err.rejection || err;
    }
}
