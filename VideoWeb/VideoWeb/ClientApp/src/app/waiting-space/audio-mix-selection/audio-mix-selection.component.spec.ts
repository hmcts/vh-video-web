import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioMixSelectionComponent } from './audio-mix-selection.component';

describe('AudioMixSelectionComponent', () => {
    let component: AudioMixSelectionComponent;
    let fixture: ComponentFixture<AudioMixSelectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AudioMixSelectionComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(AudioMixSelectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
