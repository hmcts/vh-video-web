import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';

@Component({ selector: 'app-analogue-clock', template: '' })
export class AnalogueClockStubComponent {
    @Input() hearing: Hearing;
}
