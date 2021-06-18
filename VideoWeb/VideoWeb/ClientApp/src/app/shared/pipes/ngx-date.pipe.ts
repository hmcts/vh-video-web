import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
    name: 'translateDate',
    pure: false
})
export class NgxDatePipe implements PipeTransform {
    constructor(private translateService: TranslateService, private datePipe: DatePipe) {}

    public transform(value: any, format: string): any {
        return this.datePipe.transform(value, format, null, this.translateService.currentLang);
    }
}
