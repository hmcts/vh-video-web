import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    standalone: false,
    name: 'pluraliseTextPipe'
})
export class PluraliseTextPipe implements PipeTransform {
    transform(number: number, singularText: string, pluralText: string = null): string {
        const pluralWord = pluralText ? pluralText : `${singularText}s`;
        return number > 1 ? `${pluralWord}` : `${singularText}`;
    }
}
