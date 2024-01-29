import * as THREE from 'three'

import { RendererBase } from './RendererBase'

class RendererBasic extends RendererBase {
  /*
  ** {===========================================================================
  ** Protected fields
  */

  _renderer = null;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Constructor and destructor
  */

  constructor({ canvas, outputColorSpace, pixelRatio, width, height, enableShadow, shadowType }) {
    super({ width, height });

    this._renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      outputColorSpace: outputColorSpace || THREE.SRGBColorSpace
    });
    this._renderer.setClearColor(0xffffff, 0);
    this._renderer.setPixelRatio(pixelRatio);
    this._renderer.setSize(width, height);
    if (enableShadow) {
      this._renderer.shadowMap.enabled = true;
      this._renderer.shadowMap.type = (typeof shadowType != 'undefined') ? shadowType : THREE.PCFShadowMap;
    } else {
      this._renderer.shadowMap.enabled = false;
    }
  }

  dispose() {
    this._renderer?.dispose();
    this._renderer = null;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public interfaces
  */

  getDomElement() {
    return this._renderer.domElement;
  }
  getRenderer() {
    return this._renderer;
  }

  isSupported() {
    return !!this._renderer;
  }

  setup({ scene, camera, options }) {
    return this;
  }
  update({ scene, camera }) {
    this._renderer.render(scene, camera);

    return this;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Event handlers
  */

  onResized(width, height) {
    super.onResized(width, height);

    this._renderer.setSize(width, height);
  }

  /* ===========================================================================} */
}

export { RendererBasic }
