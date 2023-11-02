export class ModalTrapFocus {
    static CSS_QUERY =
        'div.icon-button.dropdown.always-on, div.icon-button[tabindex], div.small-button[tabindex], ' +
        'div.icon-button:not(.dropdown) > fa-icon[tabindex], a[href]:not([disabled]), ' +
        'button:not([disabled]), div:not(.hide-panel) > * > * > * > * > textarea, input[type="text"]:not([disabled]), ' +
        'select:not([disabled])';

    static trap(divId: string): void {
        // create a trap focus for the modal window
        const element = document.getElementById(divId);
        const KEYCODE_TAB = 9;
        let firstFocusableEl;
        let lastFocusableEl;

        if (element) {
            const focusableEls = element.querySelectorAll(this.CSS_QUERY);
            const focusableShowMore = element.querySelectorAll('div.room-title-show-more[tabindex]');
            const focusArray = Array.from(focusableEls);
            if (focusableShowMore && focusableShowMore.length > 0) {
                focusArray.unshift(focusableShowMore[0]);
            }
            firstFocusableEl = focusArray[0];
            lastFocusableEl = focusArray[focusArray.length - 1];
            firstFocusableEl.focus();

            element.addEventListener('keydown', keyDownTrap);
        }

        function keyDownTrap(e) {
            if (e.key === 'Tab' || e.keyCode === KEYCODE_TAB) {
                if (e.shiftKey) {
                    /* shift + tab */
                    if (document.activeElement === firstFocusableEl) {
                        e.preventDefault();
                        lastFocusableEl.focus();
                    }
                } /* tab */ else {
                    if (document.activeElement === lastFocusableEl) {
                        e.preventDefault();
                        firstFocusableEl.focus();
                    }
                }
            }
        }
    }
}
