import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HearingListComponent } from './hearing-list.component';

describe('HearingListComponent', () => {
  let component: HearingListComponent;
  let fixture: ComponentFixture<HearingListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HearingListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
