import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    standalone: false,
    name: 'translateDate'
})
export class TranslateDatePipeMock implements PipeTransform {
    public name = 'translateDate';

    transform(value: string): string {
        return value;
    }
}
