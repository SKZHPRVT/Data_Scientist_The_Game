export class KeyboardHandler {
  constructor() {
    this.viewport = window.visualViewport;
    this.isKeyboardOpen = false;
    this.baseHeight = window.innerHeight;
    this.listeners = new Set();

    if (!this.viewport) {
      console.warn('[keyboard] visualViewport not available');
      return;
    }

    this.viewport.addEventListener('resize', () => this._onViewportChange());
    this.viewport.addEventListener('scroll', () => this._onViewportChange());
  }

  _onViewportChange() {
    if (!this.viewport) return;
    const currentHeight = this.viewport.height;
    const diff = this.baseHeight - currentHeight;

    const wasOpen = this.isKeyboardOpen;
    this.isKeyboardOpen = diff > 150;

    document.documentElement.style.setProperty(
      '--keyboard-offset',
      this.isKeyboardOpen ? diff + 'px' : '0px'
    );

    if (wasOpen !== this.isKeyboardOpen) {
      this.listeners.forEach((fn) => fn(this.isKeyboardOpen, diff));
    }
  }

  onKeyboardChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  blur() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
