import { NgxDatePipe } from './ngx-date.pipe';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { DatePipe } from '@angular/common';

describe('DatePipe', () => {
    const translateService = translateServiceSpy;
    const testDate = new Date('2021-06-16');
    const testFormat = 'TestFormat';

    let pipe: NgxDatePipe;
    const expectedValue = 'expectedValue';

    beforeEach(() => {
        translateService.instant.calls.reset();
        pipe = new NgxDatePipe(translateService);
        spyOn(DatePipe.prototype, 'transform').and.returnValue('expectedValue');
    });

    it('should return correct value from DatePipe', () => {
        const value = pipe.transform(testDate, testFormat);
        expect(DatePipe.prototype.transform).toHaveBeenCalledWith(testDate, testFormat);
        expect(DatePipe.prototype.transform).toHaveBeenCalledTimes(1);
        expect(value).toBe(expectedValue);
    });
});
