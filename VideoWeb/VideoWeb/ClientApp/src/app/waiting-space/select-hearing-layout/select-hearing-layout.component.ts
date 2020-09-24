import { Component, Input, OnInit } from '@angular/core';
import { ConferenceResponse } from 'src/app/services/clients/api-client';
import { HearingLayout } from '../models/hearing-layout';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-select-hearing-layout',
    templateUrl: './select-hearing-layout.component.html',
    styleUrls: ['./select-hearing-layout.component.scss']
})
export class SelectHearingLayoutComponent implements OnInit {
    selectedLayout: HearingLayout;
    @Input() conference: ConferenceResponse;
    constructor(private videoCallService: VideoCallService) {
        this.selectedLayout = null;
    }

    ngOnInit(): void {
        this.selectedLayout = this.videoCallService.preferredLayout;
    }

    getSelectedOrPreferredLayout() {
        if (this.selectedLayout) {
            return this.selectedLayout;
        } else {
            console.log(this.conference);
            const endpointCount = this.conference.endpoints ? this.conference.endpoints.length : 0;
            return this.recommendedLayout(endpointCount + this.conference.participants.length);
        }
    }

    updateSelectedLayout(layout: HearingLayout) {
        this.selectedLayout = layout;
        this.videoCallService.updatePreferredLayout(layout);
    }

    recommendedLayout(numOfParticipantsIncJudge: number): HearingLayout {
        if (numOfParticipantsIncJudge >= 10) {
            return HearingLayout.TwoPlus21;
        }

        if (numOfParticipantsIncJudge >= 6 && numOfParticipantsIncJudge <= 9) {
            return HearingLayout.OnePlus7;
        }

        return HearingLayout.Dynamic;
    }
}
