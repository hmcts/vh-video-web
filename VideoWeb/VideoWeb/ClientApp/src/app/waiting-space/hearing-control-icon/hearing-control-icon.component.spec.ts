import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HearingControlIconComponent } from './hearing-control-icon.component';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPhoneVolume } from '@fortawesome/free-solid-svg-icons';

describe('HearingControlIconComponent', () => {
    let component: HearingControlIconComponent;
    let fixture: ComponentFixture<HearingControlIconComponent>;
    let library: FaIconLibrary;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HearingControlIconComponent],
            imports: [FontAwesomeModule]
        }).compileComponents();

        library = TestBed.inject(FaIconLibrary);
        library.addIcons(faPhoneVolume); // Add the icon to the library

        fixture = TestBed.createComponent(HearingControlIconComponent);
        component = fixture.componentInstance;
        component.iconName = 'phone-volume';
        component.iconText = 'Dial Out';
        fixture.detectChanges();
    });

    describe('onIconClicked', () => {
        it('should emit iconClicked event', () => {
            spyOn(component.iconClicked, 'emit');
            component.onIconClicked();

            expect(component.iconClicked.emit).toHaveBeenCalled();
        });
    });
});
