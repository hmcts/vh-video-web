import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HearingHeaderComponent } from './hearing-header.component';

describe('HearingHeaderComponent', () => {
  let component: HearingHeaderComponent;
  let fixture: ComponentFixture<HearingHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HearingHeaderComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initalise data', async () => {
    component.ngOnInit();
    expect(component.conference).not.toBeNull();
  });
});
