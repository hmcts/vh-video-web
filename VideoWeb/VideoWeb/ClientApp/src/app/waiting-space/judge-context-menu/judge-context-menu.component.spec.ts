import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ParticipantStatus, Role } from '../../services/clients/api-client';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { JudgeContextMenuComponent } from './judge-context-menu.component';
import {
    ToggleMuteParticipantEvent,
    ToggleSpotlightParticipantEvent,
    LowerParticipantHandEvent,
    CallParticipantIntoHearingEvent,
    DismissParticipantFromHearingEvent
} from 'src/app/shared/models/participant-event';
import { ElementRef } from '@angular/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import { HearingRole } from '../models/hearing-role-model';
import { CaseTypeGroup } from '../models/case-type-group';
import { Logger } from 'src/app/services/logging/logger-base';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { MockPipe } from 'ng-mocks';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { LowerCasePipe } from '@angular/common';
export class MockElementRef extends ElementRef {
    constructor() {
        super(null);
    }
}

fdescribe('JudgeContextMenuComponent', () => {
    const participants = new ConferenceTestData().getListOfParticipants();
    const logger = new MockLogger();
    // const nativeElementSpy = jasmine.createSpyObj<any>(['contains']);
    let elementRef: MockElementRef;
    elementRef = new MockElementRef();
    elementRef.nativeElement = jasmine.createSpyObj('nativeElement', ['contains']);
    // let nativeElement: HTMLDivElement;

    let component: JudgeContextMenuComponent;
    let fixture: ComponentFixture<JudgeContextMenuComponent>;

    const translateService = translateServiceSpy;

    const mapper = new ParticipantPanelModelMapper();

    let testParticipipantPanelModel: ParticipantPanelModel;
    const testParticipantId = 'id';
    const testParticipantDisplayName = 'displayName';
    const testParticipantRole = Role.None;
    const testParticipantCaseTypeGroup = 'caseTypeGroup';
    const testParticipantPexipDisplayName = 'pexipDisplayName';
    const testParticipantHearingRole = 'hearingRole';
    const testParticipantRepresentee = 'representsee';
    const testParticipantStatus = ParticipantStatus.None;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            declarations: [JudgeContextMenuComponent, MockPipe(TranslatePipe), MockPipe(HyphenatePipe), MockPipe(LowerCasePipe)],
            providers: [
                {
                    provide: Logger,
                    useValue: logger
                },
                {
                    provide: ElementRef,
                    useValue: elementRef
                },
                {
                    provide: TranslateService,
                    useValue: translateService
                }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JudgeContextMenuComponent);
        component = fixture.componentInstance;

        testParticipipantPanelModel = new ParticipantPanelModel(
            testParticipantId,
            testParticipantDisplayName,
            testParticipantRole,
            testParticipantCaseTypeGroup,
            testParticipantPexipDisplayName,
            testParticipantHearingRole,
            testParticipantRepresentee,
            testParticipantStatus
        );
        component.participant = testParticipipantPanelModel;

        fixture.detectChanges();
    });

    describe('showCaseRole', () => {
        const dontShowForCaseTypeGroup = [
            CaseTypeGroup.NONE,
            CaseTypeGroup.JUDGE,
            CaseTypeGroup.PANEL_MEMBER,
            CaseTypeGroup.OBSERVER,
            CaseTypeGroup.ENDPOINT
        ];
        const caseTypeGroups = Object.keys(CaseTypeGroup);

        it(`should return false when case type group is null`, () => {
            component.participant.caseTypeGroup = null;
            expect(component.showCaseTypeGroup()).toBe(false);
        });

        caseTypeGroups.forEach(caseTypeGroupString => {
            const testCaseTypeGroup = CaseTypeGroup[caseTypeGroupString];
            const showFor = !dontShowForCaseTypeGroup.includes(testCaseTypeGroup);
            it(`should return ${showFor} when case type group role is ${caseTypeGroupString}`, () => {
                component.participant.caseTypeGroup = testCaseTypeGroup;
                expect(component.showCaseTypeGroup()).toBe(showFor);
            });
        });

        it(`should return true when case type group is any other value`, () => {
            const caseTypeGroup = 'AnyOtherValue';
            component.participant.caseTypeGroup = caseTypeGroup;
            expect(caseTypeGroups).not.toContain(caseTypeGroup);
            expect(component.showCaseTypeGroup()).toBe(true);
        });
    });

    it('should emit event when lowering participant hand', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        spyOn(component.lowerParticipantHandEvent, 'emit');

        // Act
        component.lowerParticipantHand();

        // Assert
        expect(component.lowerParticipantHandEvent.emit).toHaveBeenCalled();
        expect(component.lowerParticipantHandEvent.emit).toHaveBeenCalledWith(new LowerParticipantHandEvent(model));
    });

    it('should emit event when toggling spotlight', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        spyOn(component.toggleSpotlightParticipantEvent, 'emit');

        // Act
        component.toggleSpotlightParticipant();

        // Assert
        expect(component.toggleSpotlightParticipantEvent.emit).toHaveBeenCalled();
        expect(component.toggleSpotlightParticipantEvent.emit).toHaveBeenCalledWith(new ToggleSpotlightParticipantEvent(model));
    });

    it('should emit event when toggling mute', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        spyOn(component.toggleMuteParticipantEvent, 'emit');

        // Act
        component.toggleMuteParticipant();

        // Assert
        expect(component.toggleMuteParticipantEvent.emit).toHaveBeenCalled();
        expect(component.toggleMuteParticipantEvent.emit).toHaveBeenCalledWith(new ToggleMuteParticipantEvent(model));
    });

    it('should emit event when calling participant', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        spyOn(component.callParticipantIntoHearingEvent, 'emit');

        // Act
        component.callParticipantIntoHearing();

        // Assert
        expect(component.callParticipantIntoHearingEvent.emit).toHaveBeenCalled();
        expect(component.callParticipantIntoHearingEvent.emit).toHaveBeenCalledWith(new CallParticipantIntoHearingEvent(model));
    });

    it('should emit event when dismissing participant', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        spyOn(component.dismissParticipantFromHearingEvent, 'emit');

        // Act
        component.dismissParticipantFromHearing();

        // Assert
        expect(component.dismissParticipantFromHearingEvent.emit).toHaveBeenCalled();
        expect(component.dismissParticipantFromHearingEvent.emit).toHaveBeenCalledWith(new DismissParticipantFromHearingEvent(model));
    });

    it('should close context menu if click is outside of the menu', () => {
        // Arrange
        spyOn(component, 'isClickedOutsideOfOpenMenu').and.returnValue(true);
        component.isDroppedDown = true;
        const event = new MouseEvent('click', {
            clientX: 15,
            clientY: 15
        });

        // Act
        component.clickout(event);

        // Assert
        expect(component.isDroppedDown).toBeFalsy();
    });

    it('should not close context menu if click is inside of the menu', () => {
        // Arrange
        spyOn(component, 'isClickedOutsideOfOpenMenu').and.returnValue(false);
        component.isDroppedDown = true;
        const event = new MouseEvent('click', {
            clientX: 15,
            clientY: 15
        });

        // Act
        component.clickout(event);

        // Assert
        expect(component.isDroppedDown).toBeTruthy();
    });

    describe('isClickedOutsideOfOpenMenu', () => {
        let event: MouseEvent;
        let containsSpy: jasmine.Spy;
        beforeEach(() => {
            event = new MouseEvent('click');
            spyOnProperty(event, 'target').and.returnValue(document.createElement('div'));
            containsSpy = spyOn(component['elementRef'].nativeElement, 'contains');
        });
        it('should return isClickedOutsideOfOpenMenu true when click event is outside element and menu is open', () => {
            // Arrange
            component.isDroppedDown = true;
            containsSpy.and.returnValue(false);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeTruthy();
        });

        it('should return isClickedOutsideOfOpenMenu false when click event is outside element and menu is closed', () => {
            // Arrange
            component.isDroppedDown = false;
            containsSpy.and.returnValue(false);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeFalsy();
        });

        it('should return isClickedOutsideOfOpenMenu false when click event is inside element and menu is open', () => {
            // Arrange
            component.isDroppedDown = true;
            containsSpy.and.returnValue(true);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeFalsy();
        });

        it('should return isClickedOutsideOfOpenMenu false when click event is inside element and menu is closed', () => {
            // Arrange
            component.isDroppedDown = false;
            containsSpy.and.returnValue(false);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeFalsy();
        });
    });

    it('should callParticipantIntoHearing return false when the participant is a witness and in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        p.hearing_role = HearingRole.WITNESS;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canCallParticipantIntoHearing()).toBeFalsy();
    });

    it('should canCallParticipantIntoHearing return true when the participant is a witness and not in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.Available;
        p.hearing_role = HearingRole.WITNESS;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canCallParticipantIntoHearing()).toBeTruthy();
    });

    it('should canCallParticipantIntoHearing return false when the participant is a quick link observer and in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        p.role = Role.QuickLinkObserver;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canCallParticipantIntoHearing()).toBeFalsy();
    });

    it('should canCallParticipantIntoHearing return true when the participant is a quick link observer and not in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.Available;
        p.role = Role.QuickLinkObserver;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canCallParticipantIntoHearing()).toBeTruthy();
    });

    it('should canCallParticipantIntoHearing return false when the participant is a quick link participant and in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        p.role = Role.QuickLinkParticipant;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canCallParticipantIntoHearing()).toBeFalsy();
    });

    it('should canCallParticipantIntoHearing return true when the participant is a quick link participant and not in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.Available;
        p.role = Role.QuickLinkParticipant;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canCallParticipantIntoHearing()).toBeTruthy();
    });

    it('should canDismissParticipantFromHearing return false when the participant is a witness and not in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.Available;
        p.hearing_role = HearingRole.WITNESS;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canDismissParticipantFromHearing()).toBeFalsy();
    });

    it('should canDismissParticipantFromHearing return true when the participant is a witness and in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        p.hearing_role = HearingRole.WITNESS;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canDismissParticipantFromHearing()).toBeTruthy();
    });

    it('should canDismissParticipantFromHearing return false when the participant is a quick link observer and not in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.Available;
        p.role = Role.QuickLinkObserver;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canDismissParticipantFromHearing()).toBeFalsy();
    });

    it('should canDismissParticipantFromHearing return true when the participant is a quick link observer and in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        p.role = Role.QuickLinkObserver;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canDismissParticipantFromHearing()).toBeTruthy();
    });

    it('should canDismissParticipantFromHearing return false when the participant is a quick link participant and not in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.Available;
        p.role = Role.QuickLinkParticipant;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canDismissParticipantFromHearing()).toBeFalsy();
    });

    it('should canDismissParticipantFromHearing return true when the participant is a quick link participant and in hearing', () => {
        const p = participants[2];
        p.status = ParticipantStatus.InHearing;
        p.role = Role.QuickLinkParticipant;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        expect(component.canDismissParticipantFromHearing()).toBeTruthy();
    });
});
