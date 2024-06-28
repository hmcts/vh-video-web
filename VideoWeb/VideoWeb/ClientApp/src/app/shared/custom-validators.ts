import { UntypedFormControl, ValidatorFn, Validators } from '@angular/forms';

export class CustomValidators extends Validators {
    public static readonly notEmptyOrWhitespaceValidator: ValidatorFn = (control: UntypedFormControl) => {
        if (control.value?.trim().length === 0) {
            return {
                emptyOrWhitespaceError: 'value is empty or consists of whitespace only'
            };
        }

        return null;

        // Disabling next line as prettier and ng lint are arguing over the semi-colon
        // tslint:disable-next-line
    };

    public static specialCharValidator(control) {
        if (control.value.trim().length > 0 && !control.value?.match(/^[^!”#$%&()*"£¬+,./:;<=>?@[\\\]^_`{|}~]+$/)) {
            return { specialCharError: 'specialCharError' };
        }
        return null;

        // Disabling next line as prettier and ng lint are arguing over the semi-colon
        // tslint:disable-next-line
    }
}
