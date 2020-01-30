import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pluraliseTextPipe'
})

export class PluraliseTextPipePipe implements PipeTransform {
  transform(number: number, singularText: string, pluralText: string = null): string {
    const pluralWord = pluralText ? pluralText : `${singularText}s`;
    return number > 1 ? `${pluralWord}` : `${singularText}`;
  }
}
