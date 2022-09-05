export class ModalTrapFocus {
    static CSS_QUERY =
        'div.icon-button.dropdown.always-on, div.icon-button[tabindex], div.room-title-show-more' +
        'div.icon-button:not(.dropdown) > fa-icon[tabindex], a[href]:not([disabled]), ' +
        'button:not([disabled]), div:not(.hide-panel) > * > * > * > * > textarea, input[type="text"]:not([disabled]), ' +
        'select:not([disabled])';
    static trap(divId: string): void {
        // create a trap focus for the modal window
        const element = document.getElementById(divId);
        if (element) {
            const focusableEls = element.querySelectorAll(this.CSS_QUERY);

            let focusArray = Array.from(focusableEls);

            const firstFocusableEl = focusArray[0];
            const lastFocusableEl = focusArray[focusArray.length - 1];

            const KEYCODE_TAB = 9;

            element.addEventListener('keydown', function (e) {
                if (e.key === 'Tab' || e.keyCode === KEYCODE_TAB) {
                    // const tmp = document.activeElement.id;
                    // alert(tmp);
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
}
