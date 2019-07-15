import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnsupportedBrowserComponent } from './unsupported-browser.component';

describe('UnsupportedBrowserComponent', () => {
  let component: UnsupportedBrowserComponent;
  let fixture: ComponentFixture<UnsupportedBrowserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnsupportedBrowserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnsupportedBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
