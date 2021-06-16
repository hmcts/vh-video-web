import { NgxDatePipe } from './ngx-date.pipe';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';

describe('DatePipe', () => {
    const translateService = translateServiceSpy;
    const today = new Date('2021-06-16');

    beforeEach(() => {
        translateService.instant.calls.reset();
    });

    it('should return date format', () => {
        const pipe = new NgxDatePipe(translateService);
        expect(pipe.transform(today, 'dd MMM yyyy')).toBe('16 Jun 2021');
    });

    it('should return fullDate format', () => {
        const pipe = new NgxDatePipe(translateService);
        expect(pipe.transform(today, 'fullDate')).toBe('Wednesday, June 16, 2021');
    });
});
