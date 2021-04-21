import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'MultiLinePipe'
})
export class MultilinePipe implements PipeTransform {
    transform(text: string): string {
        return text
            .split(',')
            .map(x => x.trim())
            .join('<br />');
    }
}
