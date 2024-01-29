class RendererBase {
  /*
  ** {===========================================================================
  ** Public fields
  */

  width = null;
  height = null;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Constructor and destructor
  */

  constructor({ width, height }) {
    this.width = width;
    this.height = height;
  }

  dispose() {
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public interfaces
  */

  getDomElement() {
    throw 'Not implemented.';
  }
  getRenderer() {
    throw 'Not implemented.';
  }

  isSupported() {
    throw 'Not implemented.';
  }

  setup({ scene, camera, options }) {
    return this;
  }
  update({ scene, camera }) {
    return this;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Event handlers
  */

  onResized(width, height) {
    this.width = width;
    this.height = height;
  }

  /* ===========================================================================} */
}

export { RendererBase }
