import { ErrorHandler, Injectable, Injector, Type } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    private logger: Logger;
    constructor(injector: Injector) {
        this.logger = injector.get<Logger>(Logger);
    }

    handleError(error: Error) {
        this.logger.error('Unexpected error', error);
    }
}
