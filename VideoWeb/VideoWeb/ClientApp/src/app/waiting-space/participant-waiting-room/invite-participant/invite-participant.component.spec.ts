import { TestBed } from '@angular/core/testing';
import { InviteParticipantComponent } from './invite-participant.component';

describe('InviteParticipantComponent', () => {
    let component: InviteParticipantComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
          declarations: [ InviteParticipantComponent ]
        })
        .compileComponents();
      });
    
      beforeEach(() => {
        const fixture = TestBed.createComponent(InviteParticipantComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      });
      
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
