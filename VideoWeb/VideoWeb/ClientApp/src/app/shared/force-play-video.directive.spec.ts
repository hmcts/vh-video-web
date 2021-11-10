import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForcePlayVideoDirective } from './force-play-video.directive';

describe('ForcePlayVideoDirective', () => {
    let component: ForcePlayVideoDirective;
    let fixture: ComponentFixture<ForcePlayVideoDirective>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ForcePlayVideoDirective);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create an instance', () => {
        expect(component).toBeTruthy();
    });
});
