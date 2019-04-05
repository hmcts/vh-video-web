import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VhoHearingsComponent } from './vho-hearings.component';

describe('VhoHearingsComponent', () => {
  let component: VhoHearingsComponent;
  let fixture: ComponentFixture<VhoHearingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VhoHearingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VhoHearingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
