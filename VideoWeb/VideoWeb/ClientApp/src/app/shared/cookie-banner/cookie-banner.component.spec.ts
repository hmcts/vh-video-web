import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookieBannerComponent } from './cookie-banner.component';

describe('CookieBannerComponent', () => {
    let component: CookieBannerComponent;
    let fixture: ComponentFixture<CookieBannerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CookieBannerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(CookieBannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
