import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransferMessageComponent } from './transfer-message.component';
import { TranslatePipeMock } from 'src/app/testing/mocks/mock-translation-pipe';

describe('TransferMessageComponent', () => {
    let component: TransferMessageComponent;
    let fixture: ComponentFixture<TransferMessageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TransferMessageComponent, TranslatePipeMock]
        }).compileComponents();

        fixture = TestBed.createComponent(TransferMessageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
