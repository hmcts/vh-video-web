import {MissingTranslationHandler, MissingTranslationHandlerParams} from '@ngx-translate/core';

export class DisplayMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {
        return `TranslationMissing:${params.key}`;
    }
}