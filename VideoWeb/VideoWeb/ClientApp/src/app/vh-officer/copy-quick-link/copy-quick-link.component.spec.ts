import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ClipboardService } from 'ngx-clipboard';

import { CopyQuickLinkComponent } from './copy-quick-link.component';

fdescribe('CopyQuickLinkComponent', () => {
    let component: CopyQuickLinkComponent;
    let fixture: ComponentFixture<CopyQuickLinkComponent>;
    let clipboardService: any;

    beforeEach(async () => {
        const coursesServiceSpy = jasmine.createSpyObj('ClipboardService', ['copyFromContent']);

        await TestBed.configureTestingModule({
            declarations: [CopyQuickLinkComponent],
            providers: [{ provide: ClipboardService, useValue: coursesServiceSpy }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CopyQuickLinkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders icon to copy to clipboard', () => {
        expect(fixture.debugElement.query(By.css('#copy-quick-link'))).toBeTruthy();
    });

    // it('copies content into the clipboard using the clipboard service when element is clicked', () => {
    //     component.hearingId = 'some-hearing-id';
    //     fixture.detectChanges();
    //     expect().toHaveBeenCalledWith();
    // });
});
