import * as CONST from '../constants';

export function debugLog(...args: unknown[]): void {
    if (GM_getValue(CONST.DEBUG_MODE_TRG, false)) {
        console.log(...args);
    }
}
