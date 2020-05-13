import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HearingStatusComponent } from './hearing-status.component';

describe('HearingStatusComponent', () => {
  let component: HearingStatusComponent;
  let fixture: ComponentFixture<HearingStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HearingStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initalise data', async () => {
    component.ngOnInit();
    expect(component.status).not.toBeNull();
  });
});
