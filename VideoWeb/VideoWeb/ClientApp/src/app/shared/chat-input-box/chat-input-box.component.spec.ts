import { ChatInputBoxComponent } from './chat-input-box.component';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ElementRef } from '@angular/core';

describe('ChatInputBoxComponent', () => {
    let component: ChatInputBoxComponent;
    let emitSpy;
    const translateService = translateServiceSpy;
    const SCREEN_READER_INPUT_ALERT_MESSAGE = 'chat-input-box.maximum-characters-entered';

    beforeEach(() => {
        translateService.instant.calls.reset();

        component = new ChatInputBoxComponent(translateService);
        component.screenReaderInputLimitAlert = new ElementRef(document.createElement('div'));
        emitSpy = spyOn(component.submittedMessage, 'emit');
        component.ngOnInit();
        component.ngAfterViewInit();
    });

    it('should create', () => {
        expect(component.newMessageBody).toBeDefined();
    });

    it('should clear field when message has been sent', async () => {
        const body = 'test body';
        setTextInput(body);

        component.sendMessage();
        expect(component.newMessageBody.value).toBeNull();
        expect(emitSpy).toHaveBeenCalledWith(body);
    });

    it('should not send message when validation fails', () => {
        const body =
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
        setTextInput(body);

        component.sendMessage();
        expect(emitSpy).toHaveBeenCalledTimes(0);
    });

    it('should not send message when send keyboard shortcut is not pressed ', () => {
        const event = new KeyboardEvent('keydown', {
            shiftKey: true,
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(emitSpy).toHaveBeenCalledTimes(0);
    });

    it('should send message when send keyboard shortcut is pressed', () => {
        const body = 'test body';
        setTextInput(body);
        const event = new KeyboardEvent('keydown', {
            key: 'Enter'
        });

        component.onKeydown(event);
        expect(emitSpy).toHaveBeenCalledWith(body);
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

    describe('onKeyup', () => {
        it('should hide input alert for screen readers when current input length is less than max length', () => {
            const body = 'Lorem';
            setTextInput(body);
            const event = new KeyboardEvent('keyup', {
                key: 'a'
            });
            component.onKeyup(event);
            expect(component.screenReaderInputLimitAlert.nativeElement.textContent).toBe('');
        });

        it('should hide existing input alert for screen readers when current input length is less than max length', () => {
            const body = 'Lorem';
            setTextInput(body);
            showInputAlertForScreenReaders();
            const event = new KeyboardEvent('keyup', {
                key: 'a'
            });
            component.onKeyup(event);
            expect(component.screenReaderInputLimitAlert.nativeElement.textContent).toBe('');
        });

        it('should hide input alert for screen readers when current input length is greater than max length and Delete key pressed', () => {
            const body =
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
            setTextInput(body);
            const event = new KeyboardEvent('keyup', {
                key: 'Delete'
            });
            component.onKeyup(event);
            expect(component.screenReaderInputLimitAlert.nativeElement.textContent).toBe('');
        });

        it('should hide input alert for screen readers when current input length is greater than max length and Backspace key pressed', () => {
            const body =
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
            setTextInput(body);
            const event = new KeyboardEvent('keyup', {
                key: 'Backspace'
            });
            component.onKeyup(event);
            expect(component.screenReaderInputLimitAlert.nativeElement.textContent).toBe('');
        });

        it('should show input alert for screen readers when current input length is greater than max length and key pressed', () => {
            const body =
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
            setTextInput(body);
            const event = new KeyboardEvent('keyup', {
                key: 'a'
            });
            component.onKeyup(event);
            expect(component.screenReaderInputLimitAlert.nativeElement.textContent).toBe(SCREEN_READER_INPUT_ALERT_MESSAGE);
        });

        it('should show input alert for screen readers when current input length is equal to max length and key pressed', () => {
            const body =
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in';
            setTextInput(body);
            const event = new KeyboardEvent('keyup', {
                key: 'a'
            });
            component.onKeyup(event);
            expect(component.screenReaderInputLimitAlert.nativeElement.textContent).toBe(SCREEN_READER_INPUT_ALERT_MESSAGE);
        });
    });

    function setTextInput(value: string) {
        component.newMessageBody.setValue(value);
        component.newMessageBody.markAsDirty();
    }

    function showInputAlertForScreenReaders() {
        component.screenReaderInputLimitAlert.nativeElement.textContent = SCREEN_READER_INPUT_ALERT_MESSAGE;
    }
});
