import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { configureTestSuite } from 'ng-bullet';
import { ChatInputBoxComponent } from './chat-input-box.component';

describe('ChatInputBoxComponent', () => {
    let component: ChatInputBoxComponent;
    let fixture: ComponentFixture<ChatInputBoxComponent>;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [FormsModule, ReactiveFormsModule],
            declarations: [ChatInputBoxComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ChatInputBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should clear field when message has been sent', async done => {
        await fixture.whenStable();
        const body = 'test body';
        setTextInput(body);
        spyOn(component.submittedMessage, 'emit');
        component.sendMessage();
        expect(component.newMessageBody.value).toBeNull();
        expect(component.submittedMessage.emit).toHaveBeenCalledWith(body);
        done();
    });

    it('should not send message when validation fails', () => {
        spyOn(component.submittedMessage, 'emit');
        const body = '';
        setTextInput(body);
        const event = new KeyboardEvent('keydown', {
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(component.submittedMessage.emit).toHaveBeenCalledTimes(0);
    });

    it('should not send message when send keyboard shortcut is not pressed ', () => {
        spyOn(component.submittedMessage, 'emit');
        const event = new KeyboardEvent('keydown', {
            shiftKey: true,
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(component.submittedMessage.emit).toHaveBeenCalledTimes(0);
    });

    it('should send message when send keyboard shortcut is pressed', () => {
        spyOn(component.submittedMessage, 'emit');
        const body = 'test body';
        setTextInput(body);
        const event = new KeyboardEvent('keydown', {
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(component.submittedMessage.emit).toHaveBeenCalledWith(body);
    });

    it('should return character length zero when input is blank or undefined', () => {
        const body = undefined;
        setTextInput(body);
        expect(component.currentInputLength).toBe(0);
    });

    it('should return character length when set', () => {
        const body = 'hello';
        setTextInput(body);
        expect(component.currentInputLength).toBe(body.length);
    });

    it('should disable send button when input length is zero', () => {
        const body = '';
        setTextInput(body);
        expect(component.isSendingBlocked).toBeTruthy();
    });

    it('should be invalid input when form has been touched AND max length has been exceeded', () => {
        const body =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        setTextInput(body);
        expect(component.isInputInvalid).toBeTruthy();
    });

    it('should disable send button when input length is greater than max length', () => {
        const body =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        setTextInput(body);
        expect(component.isSendingBlocked).toBeTruthy();
    });

    it('should enable send button when input length is within allowed parameters', () => {
        const body = 'hello';
        setTextInput(body);
        expect(component.isSendingBlocked).toBeFalsy();
    });

    function setTextInput(value: string) {
        component.newMessageBody.setValue(value);
        component.newMessageBody.markAsDirty();
    }
});
