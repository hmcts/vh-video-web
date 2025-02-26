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
import { Logger } from 'src/app/services/logging/logger-base';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockPipe } from 'ng-mocks';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { LowerCasePipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';
import { RandomPipe } from 'src/app/shared/pipes/random.pipe';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';

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
            testParticipantPexipDisplayName,
            testParticipantHearingRole,
            testParticipantRepresentee,
            testParticipantStatus
        );
        component.participant = testParticipipantPanelModel;

        fixture.detectChanges();
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
        component.toggleLocalMuteParticipant(model);

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

        it('should return true for any participant when they are not in a hearing', () => {
            const p = participants[2];
            p.status = ParticipantStatus.Available;
            const model = mapper.mapFromParticipantUserResponse(p);
            component.participant = model;
            expect(component.canCallParticipantIntoHearing()).toBeTruthy();
        });
    });

    describe('canDismissParticipantFromHearing', () => {
        it('should return false when participant is not in the hearing', () => {
            testParticipipantPanelModel.status = ParticipantStatus.Disconnected;
            expect(component.canDismissParticipantFromHearing()).toBe(false);
        });

        it('should return true when participant is in the hearing', () => {
            testParticipipantPanelModel.status = ParticipantStatus.InHearing;
            expect(component.canDismissParticipantFromHearing()).toBe(true);
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

        it('should return true for any participant when they are in a hearing', () => {
            const p = participants[2];
            p.status = ParticipantStatus.InHearing;
            const model = mapper.mapFromParticipantUserResponse(p);
            component.participant = model;
            expect(component.canDismissParticipantFromHearing()).toBeTruthy();
        });
    });

    describe('text for buttons', () => {
        it('should return unmute local translation when participant is muted', () => {
            component.participant.isLocalMicMuted = () => true;
            component.getLocalMuteAStatusText(component.participant);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.unmute');
        });

        it('should return mute local translation when participant is unmuted', () => {
            component.participant.isLocalMicMuted = () => false;
            component.getLocalMuteAStatusText(component.participant);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.mute');
        });

        it('linked participant should include the display name in the text', () => {
            // arrange
            const linkedParticipants = new ConferenceTestData().getListOfLinkedParticipants();
            const pats = linkedParticipants.map(p => mapper.mapFromParticipantUserResponse(p));
            const roomLabel = 'Interpreter1';
            const roomId = '787';
            const model = LinkedParticipantPanelModel.fromListOfPanelModels(pats, roomLabel, roomId);
            component.participant = model;
            const participant = model.participants[0];

            // act
            const text = component.getLocalMuteAStatusText(component.participant);

            // assert
            expect(text).toContain(participant.displayName);
        });

        it('should return unmute remote translation when participant is remote muted', () => {
            component.participant.isMicRemoteMuted = () => true;
            component.getMuteAndLockStatusText();
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.unmute-lock');
        });

        it('should return mute remote translation when participant is remote unmuted', () => {
            component.participant.isMicRemoteMuted = () => false;
            component.getMuteAndLockStatusText();
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.mute-lock');
        });
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
                                fixture.detectChanges();
                                hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
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
