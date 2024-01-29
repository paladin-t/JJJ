import { ControllerBase } from './components/ControllerBase.js'
import { RendererBase } from './components/RendererBase.js'
import { WorldBase } from './components/WorldBase.js'
import { WorldDefault } from './components/WorldDefault.js'

class Game {
  /*
  ** {===========================================================================
  ** Private fields
  */

  #world = null;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Static fields
  */

  static ControllerBase = ControllerBase;
  static RendererBase = RendererBase;
  static WorldBase = WorldBase;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Constructor
  */

  constructor({ mode, canvas }) {
    let world = null;
    if (typeof mode == 'string') {
      switch (mode) {
        case 'default':
          world = new WorldDefault({ canvas });

          break;
        default:
          throw `Unknown world type "${mode}".`
      }
    } else if (typeof mode == 'function') {
      world = new mode({ canvas });
    } else if (typeof mode == 'object') {
      world = mode;
    } else {
      throw `Unknown world type "${mode}".`
    }

    this.#world = world;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public interfaces
  */

  isAutoUpdated() {
    return this.#world.isAutoUpdated;
  }

  get(what) {
    switch (what) {
      case '#world':
        return this.#world;
      default:
        return null;
    }
  }

  update() {
    this.#world.update();

    return this;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Event handlers
  */

  onResized(width, height) {
    this.#world.onResized(width, height);
  }

  onKeyDown(key) {
    this.#world.onKeyDown(key);
  }
  onKeyUp(key) {
    this.#world.onKeyUp(key);
  }

  onMouseDown(x, y) {
    this.#world.onMouseDown(x, y);
  }
  onMouseUp(x, y) {
    this.#world.onMouseUp(x, y);
  }
  onMouseMove(x, y) {
    this.#world.onMouseMove(x, y);
  }

  /* ===========================================================================} */
}

export { Game }
