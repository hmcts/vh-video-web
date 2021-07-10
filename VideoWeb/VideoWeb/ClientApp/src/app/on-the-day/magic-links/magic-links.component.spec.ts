import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MagicLinksService } from 'src/app/services/api/magic-links.service';

import { MagicLinksComponent } from './magic-links.component';

describe('MagicLinksComponent', () => {
    let component: MagicLinksComponent;
    let fixture: ComponentFixture<MagicLinksComponent>;
    let magicLinksServiceSpy: jasmine.SpyObj<MagicLinksService>;

    beforeEach(async () => {
        magicLinksServiceSpy = jasmine.createSpyObj('magicLinksService', {
            validateMagicLink: of(null)
        });

        await TestBed.configureTestingModule({
            declarations: [MagicLinksComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: {
                                get(param: string) {
                                    return 'd1faff56-aa5e-45d5-8ec5-67e7840b1f6d';
                                }
                            }
                        }
                    }
                },
                {
                    provide: MagicLinksService,
                    useValue: magicLinksServiceSpy
                }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MagicLinksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('ngOnInit', () => {
        it('should call magic links service to validate the magic link', () => {
            expect(magicLinksServiceSpy.validateMagicLink.calls.count()).toBe(1);
        });
    });
});
