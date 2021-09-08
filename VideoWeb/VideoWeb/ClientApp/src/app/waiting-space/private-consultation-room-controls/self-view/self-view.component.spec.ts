import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

import { SelfViewComponent } from './self-view.component';

describe('SelfViewComponent', () => {
    let component: SelfViewComponent;
    let fixture: ComponentFixture<SelfViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelfViewComponent],
            providers: [{ provide: TranslatePipe, useValue: TranslatePipeMock }],
            imports: [TranslateModule.forRoot()]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SelfViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
