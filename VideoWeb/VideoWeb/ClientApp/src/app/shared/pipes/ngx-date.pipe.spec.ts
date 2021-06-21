import { NgxDatePipe } from './ngx-date.pipe';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

describe('DatePipe', () => {
    let pipe: NgxDatePipe;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;
    let datePipeSpy: jasmine.SpyObj<DatePipe>;

    const testDate = new Date('2021-06-16');
    const testFormat = 'TestFormat';
    const testLocale = 'TestLocale';
    const expectedValue = 'expectedValue';

    beforeEach(() => {
        translateServiceSpy = jasmine.createSpyObj('TranslateService', ['instant'], { currentLang: testLocale });
        datePipeSpy = jasmine.createSpyObj('DatePipe', ['transform']);

        datePipeSpy.transform.and.returnValue(expectedValue);

        pipe = new NgxDatePipe(translateServiceSpy, datePipeSpy);
    });

    it('should be created', () => {
        expect(pipe).toBeTruthy();
    });

    it('should return correct value from DatePipe', () => {
        const value = pipe.transform(testDate, testFormat);
        expect(datePipeSpy.transform).toHaveBeenCalledWith(testDate, testFormat, null, testLocale);
        expect(datePipeSpy.transform).toHaveBeenCalledTimes(1);
        expect(value).toBe(expectedValue);
    });
});
