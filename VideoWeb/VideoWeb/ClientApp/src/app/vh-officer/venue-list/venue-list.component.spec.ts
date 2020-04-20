import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueListComponent } from './venue-list.component';

describe('VenueListComponent', () => {
  let component: VenueListComponent;
  let fixture: ComponentFixture<VenueListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VenueListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VenueListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
