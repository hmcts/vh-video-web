import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translate' })
export class TranslatePipeMock implements PipeTransform {
    public name = 'translate';

    transform(value: string): string {
        return value;
    }
}
