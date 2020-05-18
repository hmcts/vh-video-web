import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyIdComponent } from './copy-id.component';
import { HearingSummary } from 'src/app/shared/models/hearing-summary';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ClipboardService } from 'ngx-clipboard';
import { ElementRef } from '@angular/core';

describe('CopyIdComponent', () => {
  let component: CopyIdComponent;
  let fixture: ComponentFixture<CopyIdComponent>;
  let mouseEvent: MouseEvent;
  let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;
  let copyID: HTMLDivElement;

  beforeAll(() => {
    mouseEvent = document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent('mouseover', true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
    clipboardServiceSpy = jasmine.createSpyObj<ClipboardService>('ClipboardService', ['copyFromContent']);
    clipboardServiceSpy.copyFromContent.and.returnValue(true);
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyIdComponent ],
      providers: [
        { provide: ClipboardService, useValue: clipboardServiceSpy },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    // component = new CopyIdComponent(clipboardServiceSpy);
    fixture = TestBed.createComponent(CopyIdComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    copyID = document.createElement('div');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide the tooltip on mouse out event', () => {
    component.onMouseOut();
    expect(component.displayTooltip).toBe(true);
  });

  it('should show the tooltip on mouse over event', () => {
    component.copyID = new ElementRef(copyID);
    component.onMouseOver(mouseEvent);

    const expectedTop = mouseEvent.clientY - 15 + 'px';
    const expectedLeft = mouseEvent.clientX + 20 + 'px';
    expect(copyID.style.top).toBe(expectedTop);
    expect(copyID.style.left).toBe(expectedLeft);

    expect(component.displayTooltip).toBe(false);
    expect(component.tooltip).toBe('Copy hearing ID to clipboard');
  });

  it('should copy the conference id to the clipboard', () => {
    const conference = new ConferenceTestData().getConferenceFuture();
    const hearing = new HearingSummary(conference);
    component.copyToClipboard(hearing);
    expect(clipboardServiceSpy.copyFromContent).toHaveBeenCalledWith(hearing.id);
    expect(component.displayTooltip).toBe(false);
    expect(component.tooltip).toBe('Hearing ID copied to clipboard');
  });
});
