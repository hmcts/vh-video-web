import { NgxDatePipe } from './ngx-date.pipe';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

describe('DatePipe', () => {
    const translateService = translateServiceSpy;
    const testDate = new Date('2021-06-16');
    const testFormat = 'TestFormat';

    let pipe: NgxDatePipe;
    const expectedValue = 'expectedValue';

    beforeEach(() => {
        translateService.instant.calls.reset();
        pipe = new NgxDatePipe(translateService);
        spyOn(NgxDatePipe.prototype, 'transform').and.returnValue('expectedValue');
    });

    it('should return correct value from DatePipe', () => {
        const value = pipe.transform(testDate, testFormat);
        expect(NgxDatePipe.prototype.transform).toHaveBeenCalledWith(testDate, testFormat);
        expect(NgxDatePipe.prototype.transform).toHaveBeenCalledTimes(1);
        expect(value).toBe(expectedValue);
    });
});
