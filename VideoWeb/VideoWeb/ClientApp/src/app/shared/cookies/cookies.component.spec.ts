import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookiesComponent } from './cookies.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

fdescribe('CookiesComponent', () => {
    let component: CookiesComponent;
    let fixture: ComponentFixture<CookiesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CookiesComponent, TranslatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(CookiesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
