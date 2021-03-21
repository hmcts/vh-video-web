import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConferenceResponse, HearingLayout } from 'src/app/services/clients/api-client';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-select-hearing-layout',
    templateUrl: './select-hearing-layout.component.html'
})
export class SelectHearingLayoutComponent implements OnInit {
    availableLayouts = HearingLayout;
    selectedLayout: HearingLayout;
    accordionOpenAllElement: HTMLButtonElement;
    @Input() conference: ConferenceResponse;
    constructor(private videoCallService: VideoCallService, protected translateService: TranslateService) {}

    ngOnInit(): void {
        document.getElementById('accordion-choose-layout-heading').innerHTML = this.translateService.instant(
            'select-hearing-layout.choose-hearing-layout'
        );
        this.selectedLayout = this.videoCallService.getPreferredLayout(this.conference.id);
        if (!this.selectedLayout) {
            this.selectedLayout = this.recommendedLayout();
            this.updateSelectedLayout(this.selectedLayout);
        }

        (<any>window).GOVUKFrontend.initAll();
        document.getElementById('accordion-choose-layout-heading').onclick = (e) => this.setAccordionText(e);
        this.accordionOpenAllElement = document.getElementsByClassName('govuk-accordion__open-all').item(0) as HTMLButtonElement;
        this.accordionOpenAllElement.onclick = (e) => this.setAccordionText(e);
        this.setAccordionText({} as MouseEvent);
    }
    
    setAccordionText(event: MouseEvent) {
        const element = event.target as HTMLButtonElement
        if (element?.id == 'accordion-choose-layout-heading') {
            setTimeout(() => this.setAccordionText({} as MouseEvent), 1);
        }

        const text = this.accordionOpenAllElement.innerHTML;
        if (!text.startsWith('<')) {
            const originalText = text.split('<')[0];
            const currentText = originalText.toLowerCase().split(' ').join('-').trim();
            const translated = `<span>${this.translateService.instant(`select-hearing-layout.${currentText}`)}</span>`;
            this.accordionOpenAllElement.innerHTML = this.accordionOpenAllElement.innerHTML.replace(originalText, translated);
        }
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
