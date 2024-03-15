import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderScottishLogoSvgComponent } from './header-scottish-logo-svg.component';

describe('HeaderScottishLogoSvgComponent', () => {
    let component: HeaderScottishLogoSvgComponent;
    let fixture: ComponentFixture<HeaderScottishLogoSvgComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HeaderScottishLogoSvgComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(HeaderScottishLogoSvgComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
