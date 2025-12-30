/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes recent versions of Safari, Chrome (including
 * Opera), Edge on the desktop, and iOS and Chrome on mobile.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/**
 * By default, zone.js will patch all possible macroTask and DomEvents
 * user can disable parts of macroTask/DomEvents patch by setting following flags
 * because those flags need to be set before `zone.js` being loaded, and webpack
 * will put import in the top of bundle, so user need to create a separate file
 * in this directory (for example: zone-flags.ts), and put the following flags
 * into that file, and then add the following code before importing zone.js.
 * import './zone-flags';
 *
 * The flags allowed in zone-flags.ts are listed here.
 *
 * The following flags will work for all browsers.
 *
 * (window as any).__Zone_disable_requestAnimationFrame = true; // disable patch requestAnimationFrame
 * (window as any).__Zone_disable_on_property = true; // disable patch onProperty such as onclick
 * (window as any).__zone_symbol__UNPATCHED_EVENTS = ['scroll', 'mousemove']; // disable patch specified eventNames
 *
 *  in IE/Edge developer tools, the addEventListener will also be wrapped by zone.js
 *  with the following flag, it will bypass `zone.js` patch for IE/Edge
 *
 *  (window as any).__Zone_enable_cross_context_check = true;
 *
 */

import './zone-flags';

/***************************************************************************************************
 * Zone JS is required by default for Angular itself.
 */
import 'zone.js';  // Included with Angular CLI.


/***************************************************************************************************
 * APPLICATION IMPORTS
 */

// Hacer que todos los event listeners de touch/wheel sean pasivos por defecto
// Esto mejora el rendimiento del scroll y elimina warnings de Chrome
if (typeof window !== 'undefined') {
  const supportsPassive = (() => {
    let passive = false;
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: () => {
          passive = true;
          return passive;
        }
      });
      window.addEventListener('test' as any, null as any, opts);
      window.removeEventListener('test' as any, null as any, opts);
    } catch (e) {
      // Navegador no soporta passive
    }
    return passive;
  })();

  if (supportsPassive) {
    const addEventListenerOriginal = EventTarget.prototype.addEventListener;
    const removeEventListenerOriginal = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.addEventListener = function(
      type: string,
      listener: any,
      options?: any
    ) {
      const usesListenerOptions = typeof options === 'object' && options !== null;
      const useCapture = usesListenerOptions ? options.capture : options;

      // Hacer pasivos los eventos touch y wheel por defecto
      if (
        (type === 'touchstart' || 
         type === 'touchmove' || 
         type === 'touchend' || 
         type === 'wheel' || 
         type === 'mousewheel') &&
        !usesListenerOptions
      ) {
        options = {
          passive: true,
          capture: useCapture
        };
      }

      return addEventListenerOriginal.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function(
      type: string,
      listener: any,
      options?: any
    ) {
      return removeEventListenerOriginal.call(this, type, listener, options);
    };
  }
}
