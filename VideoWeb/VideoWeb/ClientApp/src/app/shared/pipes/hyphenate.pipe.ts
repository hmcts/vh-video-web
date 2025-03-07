import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    standalone: false,
    name: 'hyphenate',
    pure: true
})
export class HyphenatePipe implements PipeTransform {
    public transform(value: string): any {
        return value.replace(/\s/g, '-').toLowerCase();
    }
}
