import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialOutNumberComponent } from './dial-out-number.component';

describe('DialOutNumberComponent', () => {
  let component: DialOutNumberComponent;
  let fixture: ComponentFixture<DialOutNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialOutNumberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialOutNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
