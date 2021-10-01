import { FormControl } from '@angular/forms';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {
    let control: FormControl;

    describe('notEmptyOrWhitespaceValidator', () => {
        beforeEach(() => {
            control = new FormControl('', CustomValidators.notEmptyOrWhitespaceValidator);
        });

        it('should return error if the value is empty/whitespace', () => {
            const values = ['', ' '];

            values.forEach(value => {
                expect(control.invalid).toBeTrue();
                expect(control.errors.emptyOrWhitespaceError).toBe('value is empty or consists of whitespace only');
            });
        });

        it('should return null if the value is not empty/whitespace', () => {
            control.setValue('a');
            expect(control.valid).toBeTrue();
        });
    });
});
