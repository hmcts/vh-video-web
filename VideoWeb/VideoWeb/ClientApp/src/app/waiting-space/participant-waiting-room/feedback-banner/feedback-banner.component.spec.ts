import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';

import { FeedbackBannerComponent } from './feedback-banner.component';

describe('FeedbackBannerComponent', () => {
    let component: FeedbackBannerComponent;
    let fixture: ComponentFixture<FeedbackBannerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FeedbackBannerComponent, MockPipe(TranslatePipe)]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedbackBannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
