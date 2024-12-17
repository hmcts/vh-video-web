import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CookieBannerComponent } from './cookie-banner.component';
import { cookies } from '../cookies.constants';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('CookieBannerComponent', () => {
    let component: CookieBannerComponent;
    let fixture: ComponentFixture<CookieBannerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CookieBannerComponent, TranslatePipeMock]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CookieBannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
