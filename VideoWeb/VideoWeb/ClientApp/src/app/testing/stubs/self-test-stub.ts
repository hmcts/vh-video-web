import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ConferenceResponse, ParticipantResponse, TestCallScoreResponse, SelfTestPexipResponse } from 'src/app/services/clients/api-client';

@Component({ selector: 'app-self-test', template: '' })
export class SelfTestStubComponent {
    @Input() conference: ConferenceResponse;
    @Input() participant: ParticipantResponse;
    @Input() selfTestPexipConfig: SelfTestPexipResponse;

    @Output() testCompleted = new EventEmitter<TestCallScoreResponse>();

    replayVideo() { }
}
