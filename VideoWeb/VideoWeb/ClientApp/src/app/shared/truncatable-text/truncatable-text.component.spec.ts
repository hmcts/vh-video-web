import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TruncatableTextComponent } from './truncatable-text.component';

describe('TruncatableTextComponent', () => {
    let component: TruncatableTextComponent;
    let fixture: ComponentFixture<TruncatableTextComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TruncatableTextComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TruncatableTextComponent);
        component = fixture.componentInstance;
    });

    it('should display full text when text is shorter than maxLimit', () => {
        component.text = 'This is a short text';
        fixture.detectChanges();
        const textElement = fixture.nativeElement.querySelector('span');
        expect(textElement.textContent).toEqual('This is a short text');
    });

    it('should truncate text and display tooltip when a single word is longer than maxLimit', () => {
        component.maxLimit = 19;
        component.text = 'This is a very long talklikeonelongwords text that should be truncated';
        component.hideShowMore = false;
        fixture.detectChanges();
        const textElement = fixture.nativeElement.querySelector('span');
        expect(textElement.textContent).toEqual('This is a very long (show more)');
        const tooltipElement = fixture.nativeElement.querySelector('.show-more-tooltip');
        expect(tooltipElement).toBeTruthy();
    });

    it('should not display tooltip when hideShowMore is true', () => {
        component.maxLimit = 19;
        component.text = 'This is a very long talklikeonelongwords text that should be truncated';
        component.hideShowMore = true;
        fixture.detectChanges();
        const textElement = fixture.nativeElement.querySelector('span');
        expect(textElement.textContent).toEqual('This is a very long...');
        const tooltipElement = fixture.nativeElement.querySelector('.show-more-tooltip');
        expect(tooltipElement).toBeFalsy();
    });
});
