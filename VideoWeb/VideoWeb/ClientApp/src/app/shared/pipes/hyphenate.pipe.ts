import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'hyphenate',
    pure: true
})
export class HyphenatePipe implements PipeTransform {
    public transform(value: string): any {
        return value.replace(/\s/g, '-').toLowerCase();
    }
}
