import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TruncatableTextComponent } from './truncatable-text.component';

describe('TruncatableTextComponent', () => {
  let component: TruncatableTextComponent;
  let fixture: ComponentFixture<TruncatableTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TruncatableTextComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TruncatableTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
