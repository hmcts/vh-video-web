import { Pipe, PipeTransform } from '@angular/core';

    standalone: false,
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
