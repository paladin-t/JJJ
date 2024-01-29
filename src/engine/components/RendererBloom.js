import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

import { RendererBase } from './RendererBase.js'

class RendererBloom extends RendererBase {
  /*
  ** {===========================================================================
  ** Protected fields
  */

  _renderer = null;
  _composer = null;

  _renderPass = null;
  _bloomPass = null;
  _outputPass = null;

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
    this._renderer.toneMapping = THREE.ReinhardToneMapping;
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

    this._renderPass?.dispose();
    this._renderPass = null;

    this._bloomPass?.dispose();
    this._bloomPass = null;

    this._outputPass?.dispose();
    this._outputPass = null;

    this._composer?.dispose();
    this._composer = null;
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
    const strength = options?.strength || 1;
    const radius = options?.radius || 0;
    const threshold = options?.threshold || 0;

    this._renderPass = new RenderPass(scene, camera);

    this._bloomPass = new UnrealBloomPass(new THREE.Vector2(this._renderer.width, this._renderer.height), strength, radius, threshold);
    this._bloomPass.strength = strength;
    this._bloomPass.radius = radius;
    this._bloomPass.threshold = threshold;

    this._outputPass = new OutputPass();

    this._composer = new EffectComposer(this._renderer);
    this._composer.addPass(this._renderPass);
    this._composer.addPass(this._bloomPass);
    this._composer.addPass(this._outputPass);

    return this;
  }
  update({ scene, camera }) {
    this._composer.render();

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
    this._composer.setSize(width, height);
  }

  /* ===========================================================================} */
}

export { RendererBloom }
