export class ModalTrapFocus {
    static trap(divId: string): void {
        // create a trap focus for the modal window
        const element = document.getElementById(divId);
        const focusableEls = element.querySelectorAll(
            'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])'
        );

        const firstFocusableEl = focusableEls[0];
        const lastFocusableEl = focusableEls[focusableEls.length - 1];

        const KEYCODE_TAB = 9;

        element.addEventListener('keydown', function (e) {
            if (e.key === 'Tab' || e.keyCode === KEYCODE_TAB) {
                if (e.shiftKey) {
                    /* shift + tab */ if (document.activeElement === firstFocusableEl) {
                        e.preventDefault();
                    }
                } /* tab */ else {
                    if (document.activeElement === lastFocusableEl) {
                        e.preventDefault();
                    }
                }
            }
        });
    }
}
