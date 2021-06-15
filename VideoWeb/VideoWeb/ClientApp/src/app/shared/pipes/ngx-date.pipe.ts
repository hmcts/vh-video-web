import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'DateLanguage'
})
export class NgxDatePipe implements PipeTransform {
 
  constructor(private translateService: TranslateService) {
  }
 
  public transform(value: any, pattern: string = 'fullDate'): any {
    const datePipe = new DatePipe(this.translateService.currentLang);
    console.log(datePipe);
    return datePipe.transform(value, pattern);
  }
}