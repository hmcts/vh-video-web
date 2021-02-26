import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { from } from 'rxjs';

export let translateServiceSpy: jasmine.SpyObj<TranslateService>;

export let onLangChangeSpy = new EventEmitter<LangChangeEvent>();
export let currentLangSpy = 'en';

translateServiceSpy = jasmine.createSpyObj<TranslateService>(
    'TranslateService',
    ['instant', 'get', 'use', 'setDefaultLang', 'getTranslation', 'setTranslation', 'getBrowserLang'],
    {
        onLangChange: onLangChangeSpy,
        currentLang: currentLangSpy
    }
);

translateServiceSpy.instant.and.callFake(k => k);
translateServiceSpy.use.and.callFake(k => from(Promise.resolve(k)));
