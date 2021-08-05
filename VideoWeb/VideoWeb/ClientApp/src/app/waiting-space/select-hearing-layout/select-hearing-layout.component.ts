import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ConferenceResponse, HearingLayout } from 'src/app/services/clients/api-client';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-select-hearing-layout',
    templateUrl: './select-hearing-layout.component.html'
})
export class SelectHearingLayoutComponent implements OnInit, OnDestroy {
    availableLayouts = [HearingLayout.OnePlus7, HearingLayout.TwoPlus21, HearingLayout.Dynamic];
    selectedLayout: HearingLayout;
    accordionOpenAllElement: HTMLButtonElement;
    currentButtonContentKey: string;
    @Input() conference: ConferenceResponse;
    subscriptions = new Subscription();
    constructor(private videoCallService: VideoCallService, protected translateService: TranslateService) {}

    ngOnInit(): void {
        const headingElement = document.getElementById('accordion-choose-layout-heading');
        headingElement.innerHTML = this.translateService.instant('select-hearing-layout.choose-hearing-layout');
        this.selectedLayout = this.videoCallService.getPreferredLayout(this.conference.id);
        if (!this.selectedLayout) {
            this.selectedLayout = this.recommendedLayout();
            this.updateSelectedLayout(this.selectedLayout);
        }

        (<any>window).GOVUKFrontend.initAll();
        headingElement.onclick = e => this.setAccordionText(e);
        const sectionHeadingElement = document.getElementsByClassName('govuk-accordion__section-button').item(0) as HTMLButtonElement;
        sectionHeadingElement.onclick = e => this.setAccordionText(e);
        this.accordionOpenAllElement = document.getElementsByClassName('govuk-accordion__open-all').item(0) as HTMLButtonElement;
        this.accordionOpenAllElement.onclick = e => this.setAccordionText(e);
        this.setAccordionText({} as MouseEvent);

        this.subscriptions.add(this.translateService.onLangChange.subscribe(() => {
            const updatedHeadingElement = document.getElementById('accordion-choose-layout-heading');
            const currentHeaderText = updatedHeadingElement.innerText;
            const updatedHeaderText = this.translateService.instant('select-hearing-layout.choose-hearing-layout');

            updatedHeadingElement.innerHTML = updatedHeadingElement.innerHTML.replace(currentHeaderText, updatedHeaderText);
            const currentTextValue = this.accordionOpenAllElement.innerText.split('\n')[0];
            const translatedElement = this.translateService.instant(`select-hearing-layout.${this.currentButtonContentKey}`);
            this.accordionOpenAllElement.innerHTML = this.accordionOpenAllElement.innerHTML.replace(currentTextValue, translatedElement);
        }));
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setAccordionText(event: MouseEvent) {
        const element = event.target as HTMLButtonElement;
        if (element?.id === 'accordion-choose-layout-heading') {
            setTimeout(() => this.setAccordionText({} as MouseEvent), 1);
        }

        const text = this.accordionOpenAllElement.innerHTML;
        if (!text.startsWith('<')) {
            const originalText = text.split('<')[0];
            this.currentButtonContentKey = originalText.toLowerCase().split(' ').join('-').trim();
            const translatedText = this.translateService.instant(`select-hearing-layout.${this.currentButtonContentKey}`);
            const translated = `<span>${translatedText}</span>`;
            this.accordionOpenAllElement.innerHTML = this.accordionOpenAllElement.innerHTML.replace(originalText, translated);
        }
    }

    get isAccordianOpen(): boolean {
        return document.getElementById('accordian-container').classList.contains('govuk-accordion__section--expanded');
    }

    isRecommendedLayout(layout: HearingLayout): boolean {
        return this.recommendedLayout() === layout;
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
