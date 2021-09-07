import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfViewComponent } from './self-view.component';

describe('SelfViewComponent', () => {
  let component: SelfViewComponent;
  let fixture: ComponentFixture<SelfViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelfViewComponent ]
    })
    .compileComponents();
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
