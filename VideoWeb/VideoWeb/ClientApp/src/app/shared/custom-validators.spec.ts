import { UntypedFormControl } from '@angular/forms';
import { CustomValidators } from './custom-validators';

describe('CustomValidators', () => {
    let control: UntypedFormControl;

    describe('notEmptyOrWhitespaceValidator', () => {
        beforeEach(() => {
            control = new UntypedFormControl('', CustomValidators.notEmptyOrWhitespaceValidator);
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
