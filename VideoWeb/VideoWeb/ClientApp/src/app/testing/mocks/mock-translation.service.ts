import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { from } from 'rxjs';

export const onLangChangeSpy = new EventEmitter<LangChangeEvent>();
export const translateServiceSpy = jasmine.createSpyObj<TranslateService>(
    'TranslateService',
    ['instant', 'get', 'use', 'setDefaultLang', 'getTranslation', 'setTranslation', 'getBrowserLang'],
    {
        onLangChange: onLangChangeSpy
    }
);

translateServiceSpy.currentLang = 'en';
translateServiceSpy.instant.and.callFake(k => k);
translateServiceSpy.use.and.callFake(k => from(Promise.resolve(k)));
translateServiceSpy.get.and.callFake(k => from(Promise.resolve(k)));
