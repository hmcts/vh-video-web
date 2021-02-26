import { fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { LangChangeEvent } from '@ngx-translate/core';
import { from } from 'rxjs';
import { translateServiceSpy } from '../testing/mocks/mock-translation-service';
import { TestLanguageService } from './test-language.service';

describe('TestLanguageService', () => {
    const translateService = translateServiceSpy;
    let component: TestLanguageService;

    beforeEach(() => {
        translateService.getTranslation.calls.reset();
        translateService.setTranslation.calls.reset();
        component = new TestLanguageService(translateService);
    });

    it('should load tl when language switched to tl for first time', fakeAsync(() => {
        // Arrange
        const enTest = {
            Test: 'Test'
        };
        translateService.getTranslation.and.returnValue(from(Promise.resolve(enTest)));

        // Act
        component.setupSubscriptions();
        translateService.onLangChange.emit({ lang: 'tl' } as LangChangeEvent);
        flushMicrotasks();

        // Assert
        expect(translateService.getTranslation).toHaveBeenCalledOnceWith('en');
        expect(translateService.setTranslation).toHaveBeenCalledOnceWith('tl', { Test: 'Tést' });
    }));

    it('should only load tl once', fakeAsync(() => {
        // Arrange
        const enTest = {
            Test: 'Test'
        };
        translateService.getTranslation.and.returnValue(from(Promise.resolve(enTest)));

        // Act
        component.setupSubscriptions();
        translateService.onLangChange.emit({ lang: 'tl' } as LangChangeEvent);
        translateService.onLangChange.emit({ lang: 'tl' } as LangChangeEvent);
        flushMicrotasks();

        // Assert
        expect(translateService.getTranslation).toHaveBeenCalledOnceWith('en');
        expect(translateService.setTranslation).toHaveBeenCalledOnceWith('tl', { Test: 'Tést' });
    }));

    it('should not load tl when language not tl', fakeAsync(() => {
        // Arrange
        const enTest = {
            Test: 'Test'
        };
        translateService.getTranslation.and.returnValue(from(Promise.resolve(enTest)));

        // Act
        component.setupSubscriptions();
        translateService.onLangChange.emit({ lang: 'en' } as LangChangeEvent);
        translateService.onLangChange.emit({ lang: 'cy' } as LangChangeEvent);
        flushMicrotasks();

        // Assert
        expect(translateService.getTranslation).not.toHaveBeenCalled();
        expect(translateService.setTranslation).not.toHaveBeenCalled();
    }));

    it('should recurively replace to generate test language translations', () => {
        // Arrange
        const input = {
            Test1: {
                Test2: {
                    Prop1: 'Value',
                    Prop2: 'Value2'
                },
                Prop3: 'Value3'
            }
        };

        // Act
        const output = JSON.parse(JSON.stringify(input));
        component.recursiveReplace(output);

        // Assert
        expect(output.Test1.Test2.Prop1).toBe('Válúé');
        expect(output.Test1.Test2.Prop2).toBe('Válúé2');
        expect(output.Test1.Prop3).toBe('Válúé3');
    });

    it('should recurively replace to generate test language translations leaving variables', () => {
        // Arrange
        const input = {
            Test1: {
                Test2: {
                    Prop1: 'Value {{End}}',
                    Prop2: 'Value2 {{Middle}} Value2'
                },
                Prop3: '{{Start}} Value3'
            }
        };

        // Act
        const output = JSON.parse(JSON.stringify(input));
        component.recursiveReplace(output);

        // Assert
        expect(output.Test1.Test2.Prop1).toBe('Válúé {{End}}');
        expect(output.Test1.Test2.Prop2).toBe('Válúé2 {{Middle}} Válúé2');
        expect(output.Test1.Prop3).toBe('{{Start}} Válúé3');
    });
});
