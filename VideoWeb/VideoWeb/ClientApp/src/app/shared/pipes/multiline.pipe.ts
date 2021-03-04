import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'MultiLinePipe'
})
export class MultilinePipe implements PipeTransform {
    transform(text: string): string {
        return text.replace(', ', '<br />');
    }
}
