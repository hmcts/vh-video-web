import { ChatInputBoxComponent } from './chat-input-box.component';

describe('ChatInputBoxComponent', () => {
    let component: ChatInputBoxComponent;
    let emitSpy;

    beforeEach(() => {
        component = new ChatInputBoxComponent();
        emitSpy = spyOn(component.submittedMessage, 'emit');
        component.ngOnInit();
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
        const event = new KeyboardEvent('keydown', {
            key: 'Enter'
        });

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

    function setTextInput(value: string) {
        component.newMessageBody.setValue(value);
        component.newMessageBody.markAsDirty();
    }
});
