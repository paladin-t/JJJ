import * as THREE from 'three'

import { WorldBase } from './WorldBase'
import { RendererBasic } from './RendererBasic'
import { RendererBloom } from './RendererBloom'
import { RendererToon } from './RendererToon'

class WorldDefault extends WorldBase {
  /*
  ** {===========================================================================
  ** Protected fields
  */

  _renderer = null;
  _camera = null;
  _scene = null;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public fields
  */

  isAutoUpdated = true;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Constructor
  */

  constructor({ canvas }) {
    super({ canvas });
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public interfaces
  */

  get(what) {
    switch (what) {
      case '#renderer':
        return this._renderer;
      case '#camera':
        return this._camera;
      case '#scene':
        return this._scene;
      default:
        return super.get(what);
    }
  }
  find(what) {
    const node = this._scene.getObjectByName(what);
    if (node)
      return node;

    return super.find(what);
  }

  update() {
    super.update();

    this._renderer.update({ scene: this._scene, camera: this._camera });

    return this;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Internal interfaces
  */

  _setup(data, callbacks) {
    const { renderer, camera } = data;
    const { onWorldSetup } = callbacks;

    if (typeof renderer != 'undefined') {
      this._renderer?.dispose();
      this._renderer = null;
    }
    if (typeof camera != 'undefined') {
      this._camera?.dispose();
      this._camera = null;
    }

    let options = null;
    if (typeof renderer != 'undefined') {
      for (let i = 0; i < renderer.length; ++i) {
        const renderer_ = renderer[i];
        const { type } = renderer_;
        options = renderer_.options;

        if (typeof type == 'string') {
          switch (type) {
            case 'default': // Fall through.
            case 'basic':
              this._renderer = new RendererBasic({
                ...renderer_,
                canvas: this._canvas || undefined
              });
    
              break;
            case 'bloom':
              this._renderer = new RendererBloom({
                ...renderer_,
                canvas: this._canvas || undefined
              });
    
              break;
            case 'toon':
              this._renderer = new RendererToon({
                ...renderer_,
                canvas: this._canvas || undefined
              });
    
              break;
            default:
              throw `Unknown renderer type "${type}".`;
          }
        } else if (typeof type == 'function') {
          this._renderer = new type({
            ...renderer_,
            canvas: this._canvas || undefined
          });
        } else if (typeof type == 'object') {
          this._renderer = type;
        } else {
          throw `Unknown renderer type "${type}".`
        }

        if (this._renderer.isSupported()) {
          console.log(`Use renderer technique "${type}".`);

          break;
        } else {
          this._renderer.dispose();
          this._renderer = null;
        }
      }
      if (!this._renderer) {
        throw 'No supported renderer technique.';
      }
      if (!this._canvas) {
        this._canvas = this._renderer.getDomElement();
      }
    }

    if (typeof camera != 'undefined') {
      if (camera.type == 'perspective') {
        this._camera = new THREE.PerspectiveCamera(
          camera.aspect,
          this._renderer.width / this._renderer.height,
          camera.near, camera.far
        );
      } else if (camera.type == 'orthographic') {
        this._camera = new THREE.OrthographicCamera(
          camera.left, camera.right,
          camera.top, camera.bottom,
          camera.near, camera.far
        );
      } else {
        throw `Unknown camera type "${camera.type}".`;
      }
      this._camera.position.set(camera.position[0], camera.position[1], camera.position[2]);
      this._camera.lookAt(camera.target[0], camera.target[1], camera.target[2]);
    }

    if (!this._scene) {
      this._scene = new THREE.Scene();
    }

    if (typeof renderer != 'undefined') {
      this._renderer.setup({ scene: this._scene, camera: this._camera, options });
    }

    onWorldSetup?.({
      renderer: this._renderer.getRenderer(),
      camera: this._camera,
      scene: this._scene
    });

    return this;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Event handlers
  */

  onResized(width, height) {
    this._camera.aspect = width / height;
    this._camera.updateProjectionMatrix();

    this._renderer.onResized(width, height);
  }

  onKeyDown(key) {
    // Do nothing.
  }
  onKeyUp(key) {
    // Do nothing.
  }

  onMouseDown(x, y) {
    // Do nothing.
  }
  onMouseUp(x, y) {
    // Do nothing.
  }
  onMouseMove(x, y) {
    // Do nothing.
  }

  /* ===========================================================================} */
}

export { WorldDefault }
