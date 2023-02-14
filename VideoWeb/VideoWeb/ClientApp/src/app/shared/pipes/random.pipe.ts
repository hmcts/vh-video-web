import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'random'
})
export class RandomPipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        const buf = new Uint16Array(value);
        window.crypto.getRandomValues(buf);
        return buf[0];
    }
}
