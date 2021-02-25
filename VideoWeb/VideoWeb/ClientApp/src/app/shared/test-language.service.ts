import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { NEVER } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable()
export class TestLanguageService {
    translationLanguageLoaded = false;

    constructor(private translateService: TranslateService) {
    }

    setupSubscriptions() {
        console.log(`[TestLanguageService] - Subscribing to onLanguageChange - ${this.translateService.currentLang}`);
        this.translateService.onLangChange.toPromise().then(_ => {
            console.log('lang change')
        });
        
        this.translateService.onLangChange.pipe(
            tap(() => console.log('TAP')),
            switchMap((langChangeEvent: LangChangeEvent) => {
                if (langChangeEvent.lang == 'tl' && !this.translationLanguageLoaded) {
                    this.translationLanguageLoaded = true;
                    return this.translateService.getTranslation('en')
                } else {
                    return NEVER;
                }
            }),
            tap(en => {
                const tl = this.recursiveReplace(en);
                this.translateService.setTranslation('tl', tl);
            })
        ).subscribe();
    }

    recursiveReplace(obj: any): any {
        Object.keys(obj).forEach(k => {
            if(typeof obj[k] === 'string') {
                obj[k] = this.convertToTestLanguage(obj[k]);
            } else {
                this.recursiveReplace(obj[k]);
            }
        });
        return obj;
    }

    convertToTestLanguage(input: string) {
        input = input.replace(/\a/gi, 'á');
        input = input.replace(/\e/gi, 'é');
        input = input.replace(/\i/gi, 'í');
        input = input.replace(/\o/gi, 'ó');
        input = input.replace(/\u/gi, 'ú');
        return input;
    }
}