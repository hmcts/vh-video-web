import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs/operators';

@Injectable()
export class TestLanguageService {
    translationLanguageLoaded = false;
    loggerPrefix = '[TestLanguageService] -';

    constructor(private translateService: TranslateService) {}

    setupSubscriptions() {
        console.info(`${this.loggerPrefix} Subscribing to onLanguageChange`);
        this.translateService.onLangChange
            .pipe(
                filter(e => e.lang === 'tl'),
                tap(() => this.setupTestLanguageTranslations())
            )
            .subscribe();
    }

    setupTestLanguageTranslations() {
        if (!this.translationLanguageLoaded) {
            this.translationLanguageLoaded = true;
            this.translateService
                .getTranslation('en')
                .pipe(
                    tap(en => {
                        console.info(`${this.loggerPrefix} Generating TranslationLanguage Translations`);
                        const tl = JSON.parse(JSON.stringify(en));
                        this.recursiveReplace(tl);
                        this.translateService.setTranslation('tl', tl);
                    })
                )
                .subscribe();
        }
    }

    recursiveReplace(obj: any): any {
        Object.keys(obj).forEach(k => {
            if (typeof obj[k] === 'string') {
                obj[k] = this.convertToTestLanguage(obj[k]);
            } else {
                this.recursiveReplace(obj[k]);
            }
        });
    }

    convertToTestLanguage(input: string) {
        const inputSections = input.split('{{').map(section => {
            const varSections = section.split('}}');
            const last = varSections
                .pop()
                .replace(/\a/gi, 'á')
                .replace(/\e/gi, 'é')
                .replace(/\i/gi, 'í')
                .replace(/\o/gi, 'ó')
                .replace(/\u/gi, 'ú');
            varSections.push(last);
            return varSections.join('}}');
        });
        const output = inputSections.join('{{');
        return output;
    }
}
