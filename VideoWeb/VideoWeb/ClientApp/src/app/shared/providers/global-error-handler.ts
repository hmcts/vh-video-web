import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Logger } from 'src/app/services/logging/logger-base';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
    constructor(private readonly injector: Injector) {}

    private get logger() {
        return this.injector.get<Logger>(Logger);
    }

    handleError(error: Error) {
        this.logger.error('Unexpected error', error);
    }
}
