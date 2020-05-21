import { Component, Input } from '@angular/core';
import { Hearing } from 'src/app/shared/models/hearing';
@Component({ selector: 'app-judge-chat', template: '' })
export class JudgeChatStubComponent {
    @Input()
    hearing: Hearing;
}
