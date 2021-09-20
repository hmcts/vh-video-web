import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'hyphenate',
    pure: false
})
export class HyphenatePipe implements PipeTransform {
    constructor() {}

    public transform(value: string): any {
        return value.replace(/\s/g, '-').toLowerCase();
    }
}
