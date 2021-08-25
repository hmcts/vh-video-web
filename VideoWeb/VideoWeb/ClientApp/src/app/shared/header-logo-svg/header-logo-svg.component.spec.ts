import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderLogoSvgComponent } from './header-logo-svg.component';

describe('HeaderLogoSvgComponent', () => {
  let component: HeaderLogoSvgComponent;
  let fixture: ComponentFixture<HeaderLogoSvgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeaderLogoSvgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderLogoSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
