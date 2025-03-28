import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription } from 'rxjs';
import { HearingLayout } from 'src/app/services/clients/api-client';
import { HearingLayoutService } from 'src/app/services/hearing-layout.service';
import { Accordion, createAll } from 'govuk-frontend';
import { VHConference } from '../store/models/vh-conference';

@Component({
    standalone: false,
    selector: 'app-select-hearing-layout',
    templateUrl: './select-hearing-layout.component.html',
    styleUrls: ['./select-hearing-layout.component.scss']
})
export class SelectHearingLayoutComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() conference: VHConference;
    @Input() callback: Function;
    @Input() onHostToolBar = false;
    @Input() showActionButtons = false;

    @Output() closeButtonPressed = new EventEmitter();

    availableLayouts: HearingLayout[];

    accordionOpenAllElement: HTMLButtonElement;
    currentButtonContentKey: string;

    subscriptions = new Subscription();

    private readonly availableLayoutsWR = [
        HearingLayout.OnePlus7,
        HearingLayout.TwoPlus21,
        HearingLayout.Dynamic,
        HearingLayout.NineEqual,
        HearingLayout.SixteenEqual,
        HearingLayout.TwentyFiveEqual
    ];
    private readonly availableLayoutHostToolBar = [
        HearingLayout.OnePlus7,
        HearingLayout.TwoPlus21,
        HearingLayout.NineEqual,
        HearingLayout.SixteenEqual,
        HearingLayout.TwentyFiveEqual
    ];
    private readonly SELECT_HEARING_CONTAINER_ID = 'select-hearing-container-content-1';
    private readonly LAYOUT_RADIO_BUTTON_ID_PREFIX = 'layout-radio-button-';

    constructor(
        private readonly hearingLayoutService: HearingLayoutService,
        protected readonly translateService: TranslateService
    ) {}

    get currentLayout$(): Observable<HearingLayout> {
        return this.hearingLayoutService.currentLayout$;
    }

    get recommendedLayout$(): Observable<HearingLayout> {
        return this.hearingLayoutService.recommendedLayout$;
    }

    get isAccordianOpen(): boolean {
        return document.getElementById('accordian-container').classList.contains('govuk-accordion__section--expanded');
    }

    ngOnInit(): void {
        this.availableLayouts = this.onHostToolBar ? this.availableLayoutHostToolBar : this.availableLayoutsWR;
        createAll(Accordion);
        const headingElement = document.getElementById('accordion-choose-layout-heading');

        headingElement.innerHTML = this.translateService.instant('select-hearing-layout.choose-hearing-layout');

        headingElement.onclick = e => this.setAccordionText(e);
        const sectionHeadingElement = document.getElementsByClassName('govuk-accordion__section-button').item(0) as HTMLButtonElement;
        sectionHeadingElement.onclick = e => this.setAccordionText(e);
        this.accordionOpenAllElement = document.getElementsByClassName('govuk-accordion__open-all').item(0) as HTMLButtonElement;
        this.accordionOpenAllElement?.addEventListener('click', e => this.setAccordionText(e));
        this.setAccordionText({} as MouseEvent);

        this.subscriptions.add(
            this.translateService.onLangChange.subscribe(() => {
                const updatedHeadingElement = document.getElementById('accordion-choose-layout-heading');
                const currentHeaderText = updatedHeadingElement.innerText;
                const updatedHeaderText = this.translateService.instant('select-hearing-layout.choose-hearing-layout');

                updatedHeadingElement.innerHTML = updatedHeadingElement.innerHTML.replace(currentHeaderText, updatedHeaderText);
                const currentTextValue = this.accordionOpenAllElement.innerText.split('\n')[0];
                const translatedElement = this.translateService.instant(`select-hearing-layout.${this.currentButtonContentKey}`);
                this.accordionOpenAllElement.innerHTML = this.accordionOpenAllElement.innerHTML.replace(
                    currentTextValue,
                    translatedElement
                );
            })
        );
    }

    ngAfterViewInit() {
        this.scrollSelectedLayoutIntoView();
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    setAccordionText(event: MouseEvent) {
        const element = event.target as HTMLButtonElement;
        if (element?.id === 'accordion-choose-layout-heading') {
            setTimeout(() => this.setAccordionText({} as MouseEvent), 1);
        }

        if (!this.accordionOpenAllElement) {
            return;
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

    updateSelectedLayout(layout: HearingLayout, callback: Function) {
        this.hearingLayoutService.updateCurrentLayout(layout);
        if (callback) {
            callback(layout);
        }
    }

    onClose() {
        this.closeButtonPressed.emit();
    }

    scrollSelectedLayoutIntoView() {
        this.currentLayout$.subscribe(currentLayout => {
            const selectedLayout = this.availableLayouts.find(l => l === currentLayout);
            const selectedLayoutElement = document.getElementById(`${this.LAYOUT_RADIO_BUTTON_ID_PREFIX}${selectedLayout}`);

            if (!selectedLayoutElement) {
                return;
            }

            const container = document.getElementById(this.SELECT_HEARING_CONTAINER_ID);

            const elementRect = selectedLayoutElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const offsetTop = elementRect.top - containerRect.top;

            container.scrollBy({
                top: offsetTop,
                behavior: 'smooth'
            });
        });
    }
}
