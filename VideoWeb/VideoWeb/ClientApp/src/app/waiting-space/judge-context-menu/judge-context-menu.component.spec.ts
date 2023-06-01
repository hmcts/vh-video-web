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
    DismissParticipantFromHearingEvent,
    ToggleLocalMuteParticipantEvent
} from 'src/app/shared/models/participant-event';
import { DebugElement, ElementRef } from '@angular/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import { HearingRole } from '../models/hearing-role-model';
import { CaseTypeGroup } from '../models/case-type-group';
import { Logger } from 'src/app/services/logging/logger-base';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockPipe } from 'ng-mocks';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { LowerCasePipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';
import { RandomPipe } from 'src/app/shared/pipes/random.pipe';

export class MockElementRef extends ElementRef {
    constructor() {
        super(null);
    }
}

describe('JudgeContextMenuComponent', () => {
    const participants = new ConferenceTestData().getListOfParticipants();
    const logger = new MockLogger();

    const elementRef = new MockElementRef();
    elementRef.nativeElement = jasmine.createSpyObj('nativeElement', ['contains']);

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
    let hyphenateSpy: jasmine.Spy;
    let translateSpy: jasmine.Spy;
    let lowerCaseSpy: jasmine.Spy;
    let random: jasmine.Spy;

    beforeEach(async () => {
        hyphenateSpy = jasmine.createSpy('transform').and.callThrough();
        translateSpy = jasmine.createSpy('transform').and.callThrough();
        lowerCaseSpy = jasmine.createSpy('transform').and.callThrough();
        random = jasmine.createSpy('transform').and.callThrough();

        await TestBed.configureTestingModule({
            declarations: [
                JudgeContextMenuComponent,
                MockPipe(TranslatePipe, translateSpy),
                MockPipe(HyphenatePipe, hyphenateSpy),
                MockPipe(LowerCasePipe, lowerCaseSpy),
                MockPipe(RandomPipe, random)
            ],
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
        const dontShowForCaseTypeGroup = [CaseTypeGroup.NONE, CaseTypeGroup.JUDGE, CaseTypeGroup.OBSERVER, CaseTypeGroup.ENDPOINT];
        const caseTypeGroups = Object.keys(CaseTypeGroup);

        it('should return false when case type group is null', () => {
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

        it('should return true when case type group is any other value', () => {
            const caseTypeGroup = 'AnyOtherValue';
            component.participant.caseTypeGroup = caseTypeGroup;
            expect(caseTypeGroups).not.toContain(caseTypeGroup);
            expect(component.showCaseTypeGroup()).toBe(true);
        });
    });

    describe('showHearingRole', () => {
        const dontShowForHearingRole = [HearingRole.JUDGE, ...HearingRoleHelper.panelMemberRoles];
        const hearingRoles = Object.keys(HearingRole);

        hearingRoles.forEach(hearingRoleString => {
            const testHearingRole = HearingRole[hearingRoleString];
            const showFor = !dontShowForHearingRole.includes(testHearingRole);
            it(`should return ${showFor} when hearing role is ${hearingRoleString}`, () => {
                component.participant.hearingRole = testHearingRole;
                expect(component.showHearingRole()).toBe(showFor);
            });
        });

        it('should return true when hearing role is any other value', () => {
            const hearingRole = 'AnyOtherValue';
            component.participant.hearingRole = hearingRole;
            expect(hearingRoles).not.toContain(hearingRole);
            expect(component.showHearingRole()).toBe(true);
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

    it('should emit event when toggling local mute participant', () => {
        // Arrange
        const p = participants[0];
        p.status = ParticipantStatus.InHearing;
        const model = mapper.mapFromParticipantUserResponse(p);
        component.participant = model;
        spyOn(component.toggleLocalMuteParticipantEvent, 'emit');

        // Act
        component.toggleLocalMuteParticipant();

        // Assert
        expect(component.toggleLocalMuteParticipantEvent.emit).toHaveBeenCalled();
        expect(component.toggleLocalMuteParticipantEvent.emit).toHaveBeenCalledWith(new ToggleLocalMuteParticipantEvent(model));
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

    describe('canCallParticipantIntoHearing', () => {
        it('should return false when participant cannot be called', () => {
            spyOnProperty(testParticipipantPanelModel, 'isCallableAndReadyToJoin').and.returnValue(false);
            expect(component.canCallParticipantIntoHearing()).toBe(false);
        });

        it('should return true when participant can be called', () => {
            spyOnProperty(testParticipipantPanelModel, 'isCallableAndReadyToJoin').and.returnValue(true);
            expect(component.canCallParticipantIntoHearing()).toBe(true);
        });
    });

    describe('canDismissParticipantFromHearing', () => {
        it('should return false when participant cannot be called', () => {
            spyOnProperty(testParticipipantPanelModel, 'isCallableAndReadyToBeDismissed').and.returnValue(false);
            expect(component.canDismissParticipantFromHearing()).toBe(false);
        });

        it('should return true when participant can be called', () => {
            spyOnProperty(testParticipipantPanelModel, 'isCallableAndReadyToBeDismissed').and.returnValue(true);
            expect(component.canDismissParticipantFromHearing()).toBe(true);
        });
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

    describe('UI tests', () => {
        let dropdownElement;
        function fakeGetElementId(section: string) {
            return `${component.idPrefix}-${section}-undefined`;
        }
        describe('dropdown', () => {
            beforeEach(() => {
                const dropdownId = fakeGetElementId('dropdown');
                dropdownElement = fixture.debugElement.query(By.css(`#${dropdownId}`));
            });
            it('dropdown should be hidden', () => {
                component.isDroppedDown = false;
                fixture.detectChanges();
                expect(dropdownElement.nativeElement.hasAttribute('hidden')).toBe(true);
            });

            describe('when visible', () => {
                describe('header', () => {
                    beforeEach(() => {
                        component.isDroppedDown = true;
                        fixture.detectChanges();
                    });
                    it('dropdown should not be hidden', () => {
                        expect(dropdownElement.nativeElement.hasAttribute('hidden')).toBe(false);
                    });

                    it('displayName should be correct', () => {
                        const displayNameId = fakeGetElementId('display-name');
                        const displayNameStrongElement = fixture.debugElement.query(By.css(`#${displayNameId} > strong`));

                        expect(displayNameStrongElement.nativeElement.textContent.trim()).toEqual(testParticipantDisplayName);
                    });
                    describe('hearing role', () => {
                        let hearingRoleFullElement;
                        let hearingRoleFullElementId;
                        beforeEach(() => {
                            hearingRoleFullElementId = fakeGetElementId('hearing-role-full');
                        });
                        it('should not show for judge', () => {
                            component.participant.hearingRole = HearingRole.JUDGE;
                            fixture.detectChanges();
                            hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
                            expect(hearingRoleFullElement).toBeFalsy();
                        });
                        const panelMemberHearingRoles = HearingRoleHelper.panelMemberRoles;
                        panelMemberHearingRoles.forEach(hearingRole => {
                            it(`should not show for panel member - ${hearingRole}`, () => {
                                component.participant.hearingRole = hearingRole;
                                fixture.detectChanges();
                                hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
                                expect(hearingRoleFullElement).toBeFalsy();
                            });
                        });

                        describe('when not judge or panel member', () => {
                            beforeEach(() => {
                                component.participant.caseTypeGroup = CaseTypeGroup.NONE;
                                fixture.detectChanges();
                                hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
                            });
                            it('should show for non-judge or non-panel member', () => {
                                const nonJudgePanelMemberCaseTypeGroups = Object.values(CaseTypeGroup).filter(
                                    group => group !== CaseTypeGroup.JUDGE && group !== CaseTypeGroup.PANEL_MEMBER
                                );
                                nonJudgePanelMemberCaseTypeGroups.forEach(group => {
                                    component.participant.caseTypeGroup = group;
                                    fixture.detectChanges();
                                    expect(hearingRoleFullElement).toBeTruthy();
                                });
                            });

                            it('should have correct hearing role', () => {
                                const testHearingRole = 'Test hearing role';
                                const testHearingRoleHyphenated = 'test-hearing-role-hyphenated';
                                const testHearingRoleHyphenatedWithPrefix = `hearing-role.${testHearingRoleHyphenated}`;
                                const testHearingRoleTranslated = 'Test hearing role translated';
                                hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);

                                component.participant.hearingRole = testHearingRole;
                                fixture.detectChanges();

                                const hearingRoleElementId = fakeGetElementId('hearing-role');
                                const hearingRoleElement = fixture.debugElement.query(By.css(`#${hearingRoleElementId}`));

                                expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                expect(hearingRoleElement.nativeElement.textContent.trim()).toEqual(testHearingRoleTranslated);
                            });

                            describe('representee', () => {
                                let representeeElementId: string;
                                beforeEach(() => {
                                    representeeElementId = fakeGetElementId('representee');
                                });

                                it('should not display', () => {
                                    component.participant.representee = null;
                                    fixture.detectChanges();
                                    const representeeElement = fixture.debugElement.query(By.css(`#${representeeElementId}`));
                                    expect(representeeElement).toBeFalsy();
                                });

                                it('should have correct details for representee', () => {
                                    const representeeString = 'Test representee';
                                    component.participant.representee = representeeString;
                                    fixture.detectChanges();

                                    const representeeElement = fixture.debugElement.query(By.css(`#${representeeElementId}`));
                                    expect(representeeElement).toBeTruthy();
                                    expect(representeeElement.nativeElement.textContent.trim()).toEqual(representeeString);
                                });
                            });

                            describe('case type group', () => {
                                let caseTypeGroupId: string;
                                beforeEach(() => {
                                    caseTypeGroupId = fakeGetElementId('case-type-group');
                                });

                                it('should not display', () => {
                                    spyOn(component, 'showCaseTypeGroup').and.returnValue(false);
                                    component.participant.caseTypeGroup = 'anything';
                                    fixture.detectChanges();
                                    const caseTypeGroupElement = fixture.debugElement.query(By.css(`#${caseTypeGroupId}`));
                                    expect(caseTypeGroupElement).toBeFalsy();
                                });

                                it('should have correct details for case type group', () => {
                                    spyOn(component, 'showCaseTypeGroup').and.returnValue(true);
                                    const testCaseTypeGroup = 'Test case type group';
                                    const testCaseTypeGroupHyphenated = 'test-case-type-group-hyphenated';
                                    const testCaseTypeGroupHyphenatedWithPrefix = `case-role.${testCaseTypeGroupHyphenated}`;
                                    const testCaseTypeGroupRoleTranslated = 'case type group translated';
                                    hyphenateSpy.withArgs(testCaseTypeGroup).and.returnValue(testCaseTypeGroupHyphenated);
                                    translateSpy
                                        .withArgs(testCaseTypeGroupHyphenatedWithPrefix)
                                        .and.returnValue(testCaseTypeGroupRoleTranslated);

                                    component.participant.caseTypeGroup = testCaseTypeGroup;
                                    fixture.detectChanges();
                                    const caseTypeGroupElement = fixture.debugElement.query(By.css(`#${caseTypeGroupId}`));

                                    expect(hyphenateSpy).toHaveBeenCalledWith(testCaseTypeGroup);
                                    expect(translateSpy).toHaveBeenCalledWith(testCaseTypeGroupHyphenatedWithPrefix);
                                    expect(caseTypeGroupElement).toBeTruthy();
                                    expect(caseTypeGroupElement.nativeElement.textContent.trim()).toEqual(testCaseTypeGroupRoleTranslated);
                                });
                            });
                        });
                    });
                });

                describe('controls', () => {
                    const testHearingRole = 'Test hearing role';
                    const testHearingRoleHyphenated = 'test-hearing-role-hyphenated';
                    const testHearingRoleHyphenatedWithPrefix = `hearing-role.${testHearingRoleHyphenated}`;
                    const testHearingRoleTranslated = 'Test hearing role translated';
                    const testHearingRoleTranslatedLowercase = 'test hearing role translated lower case';

                    describe('call', () => {
                        let callId;
                        let canCallParticipantIntoHearingSpy: jasmine.Spy;
                        let callElement: DebugElement;
                        beforeEach(() => {
                            callId = fakeGetElementId('call');
                            canCallParticipantIntoHearingSpy = spyOn(component, 'canCallParticipantIntoHearing');
                        });

                        it('should not display', () => {
                            canCallParticipantIntoHearingSpy.and.returnValue(false);
                            fixture.detectChanges();
                            callElement = fixture.debugElement.query(By.css(`#${callId}`));
                            expect(callElement).toBeFalsy();
                        });

                        describe('when canCallParticipantIntoHearing is true', () => {
                            beforeEach(() => {
                                canCallParticipantIntoHearingSpy.and.returnValue(true);
                                fixture.detectChanges();
                                callElement = fixture.debugElement.query(By.css(`#${callId}`));
                            });

                            it('should display', () => {
                                expect(callElement).toBeTruthy();
                            });

                            it('should display correct value when not witness', () => {
                                const admitParticipantPath = 'judge-context-menu.admit-participant';
                                const admitReturn = 'Admit return';

                                hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);
                                lowerCaseSpy.withArgs(testHearingRoleTranslated).and.returnValue(testHearingRoleTranslatedLowercase);
                                translateSpy
                                    .withArgs(admitParticipantPath, { role: testHearingRoleTranslatedLowercase })
                                    .and.returnValue(admitReturn);
                                spyOnProperty(component, 'isWitness').and.returnValue(false);
                                component.participant.hearingRole = testHearingRole;
                                fixture.detectChanges();

                                callElement = fixture.debugElement.query(By.css(`#${callId}`));
                                expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                expect(lowerCaseSpy).toHaveBeenCalledWith(testHearingRoleTranslated);
                                expect(translateSpy).toHaveBeenCalledWith(admitParticipantPath, {
                                    role: testHearingRoleTranslatedLowercase
                                });
                                expect(callElement.nativeElement.textContent.trim()).toEqual(admitReturn);
                            });

                            it('should display correct value when witness', () => {
                                const callWitnessPath = 'judge-context-menu.call-witness';
                                const witnessReturn = 'Witness return';
                                translateSpy.withArgs(callWitnessPath).and.returnValue(witnessReturn);
                                spyOnProperty(component, 'isWitness').and.returnValue(true);
                                fixture.detectChanges();

                                callElement = fixture.debugElement.query(By.css(`#${callId}`));
                                expect(translateSpy).toHaveBeenCalledWith(callWitnessPath);
                                expect(callElement.nativeElement.textContent.trim()).toEqual(witnessReturn);
                            });
                        });
                    });

                    describe('dismiss', () => {
                        let dismissId;
                        let canDismissParticipantFromHearingSpy: jasmine.Spy;
                        let dismissElement: DebugElement;

                        beforeEach(() => {
                            dismissId = fakeGetElementId('dismiss');
                            canDismissParticipantFromHearingSpy = spyOn(component, 'canDismissParticipantFromHearing');
                        });

                        it('should not display', () => {
                            canDismissParticipantFromHearingSpy.and.returnValue(false);
                            fixture.detectChanges();
                            dismissElement = fixture.debugElement.query(By.css(`#${dismissId}`));
                            expect(dismissElement).toBeFalsy();
                        });

                        describe('when canDismissParticipantFromHearing is true', () => {
                            beforeEach(() => {
                                canDismissParticipantFromHearingSpy.and.returnValue(true);
                                fixture.detectChanges();
                                dismissElement = fixture.debugElement.query(By.css(`#${dismissId}`));
                            });

                            it('should display', () => {
                                expect(dismissElement).toBeTruthy();
                            });

                            it('should display correct value when not witness', () => {
                                const dismissParticipantPath = 'judge-context-menu.dismiss-participant';
                                const dismissReturn = 'Dismiss return';

                                hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);
                                lowerCaseSpy.withArgs(testHearingRoleTranslated).and.returnValue(testHearingRoleTranslatedLowercase);
                                translateSpy
                                    .withArgs(dismissParticipantPath, { role: testHearingRoleTranslatedLowercase })
                                    .and.returnValue(dismissReturn);
                                component.participant.hearingRole = testHearingRole;
                                fixture.detectChanges();

                                dismissElement = fixture.debugElement.query(By.css(`#${dismissId}`));

                                expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                expect(lowerCaseSpy).toHaveBeenCalledWith(testHearingRoleTranslated);
                                expect(translateSpy).toHaveBeenCalledWith(dismissParticipantPath, {
                                    role: testHearingRoleTranslatedLowercase
                                });
                                expect(dismissElement.nativeElement.textContent.trim()).toEqual(dismissReturn);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('idPrefix', () => {
        let expectedValue: string;

        const prefix = 'judge-context-menu';

        it('should return correct value when section is null and participant id is present', () => {
            component.participant.id = testParticipantId;
            fixture.detectChanges();
            expectedValue = `${prefix}-participant-${testParticipantId}`;
        });

        it('should return correct value when section and participant id is null', () => {
            component.participant.id = null;
            expectedValue = `${prefix}`;
        });

        it('should return correct value when section and participant is null', () => {
            component.participant = null;
            expectedValue = `${prefix}`;
        });

        afterEach(() => {
            component.ngOnInit();
            expect(component.idPrefix).toEqual(expectedValue);
        });
    });
});
