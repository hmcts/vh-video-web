import { Component, Input, OnInit } from '@angular/core';
import { ConferenceResponse, HearingLayout } from 'src/app/services/clients/api-client';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-select-hearing-layout',
    templateUrl: './select-hearing-layout.component.html'
})
export class SelectHearingLayoutComponent implements OnInit {
    availableLayouts = HearingLayout;
    selectedLayout: HearingLayout;
    @Input() conference: ConferenceResponse;
    constructor(private videoCallService: VideoCallService) {}

    ngOnInit(): void {
        this.selectedLayout = this.videoCallService.getPreferredLayout(this.conference.id);
        if (!this.selectedLayout) {
            this.selectedLayout = this.recommendedLayout();
        }
        (<any>window).GOVUKFrontend.initAll();
    }

    get recommendDynamic(): boolean {
        return this.recommendedLayout() === HearingLayout.Dynamic;
    }

    get recommend1Plus7(): boolean {
        return this.recommendedLayout() === HearingLayout.OnePlus7;
    }

    get recommend2Plus21(): boolean {
        return this.recommendedLayout() === HearingLayout.TwoPlus21;
    }

    get isAccordianOpen(): boolean {
        return document.getElementById('accordian-container').classList.contains('govuk-accordion__section--expanded');
    }

    recommendedLayout(): HearingLayout {
        const endpointCount = this.conference.endpoints ? this.conference.endpoints.length : 0;
        return this.recommendLayoutFor(endpointCount + this.conference.participants.length);
    }

    getSelectedOrPreferredLayout(): HearingLayout {
        if (this.selectedLayout) {
            return this.selectedLayout;
        } else {
            return this.recommendedLayout();
        }
    }

    recommendLayoutFor(numOfParticipantsIncJudge: number): HearingLayout {
        if (numOfParticipantsIncJudge >= 10) {
            return HearingLayout.TwoPlus21;
        }

        if (numOfParticipantsIncJudge >= 6 && numOfParticipantsIncJudge <= 9) {
            return HearingLayout.OnePlus7;
        }

        return HearingLayout.Dynamic;
    }

    updateSelectedLayout(layout: HearingLayout) {
        this.selectedLayout = layout;
        this.videoCallService.updatePreferredLayout(this.conference.id, layout);
    }
}
