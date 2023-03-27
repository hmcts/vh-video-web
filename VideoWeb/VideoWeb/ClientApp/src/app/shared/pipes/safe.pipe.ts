import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'safe'
})
export class SafePipe implements PipeTransform {
    transform(value: any) {
        return value.replace(/[^a-zA-Z0-9_ ]/g, '');
    }
}
