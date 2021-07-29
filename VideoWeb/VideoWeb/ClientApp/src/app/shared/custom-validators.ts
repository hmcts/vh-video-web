import { FormControl, ValidatorFn, Validators } from '@angular/forms';

export class CustomValidators extends Validators {
    public static notEmptyOrWhitespaceValidator: ValidatorFn = (control: FormControl) => {
        if (control.value?.trim().length === 0) {
            return {
                emptyOrWhitespaceError: 'value is empty or consists of whitespace only'
            };
        }

        return null;
    }
}
