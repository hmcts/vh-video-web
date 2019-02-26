import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  const router = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [{ provide: Router, useValue: router }]
    },

    )
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the head component', () => {
    expect(component).toBeTruthy();
  });
  it('header component should have top menu items', () => {
    component.topMenuItems = [];
    component.ngOnInit();
    expect(component.topMenuItems.length).toBeGreaterThan(0);
  });
  it('selected top menu item has active property set to true, others item active set to false', () => {
    component.topMenuItems = [];
    component.ngOnInit();
    component.selectMenuItem(0);
    expect(component.topMenuItems[0].active).toBeTruthy();
    if (component.topMenuItems.length > 1) {
      for (const item of component.topMenuItems.slice(1)) {
        expect(item.active).toBeFalsy();
      }
    }
  });
  it('user should navigate by selecting top meny item', () => {
    component.ngOnInit();
    component.selectMenuItem(0);
    expect(router.navigate).toHaveBeenCalledWith([component.topMenuItems[0].url]);
});
});
