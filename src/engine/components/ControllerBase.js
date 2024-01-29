class ControllerBase {
  /*
  ** {===========================================================================
  ** Protected fields
  */

  _target = null;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public fields
  */

  type = null;

  parent = null;

  isController = true;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Constructor and destructor
  */

  constructor() {
  }

  dispose() {
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public interfaces
  */

  control(node, data, callbacks) {
    this.type = data.type;
    this.parent = node;

    return this;
  }

  update(delta) {
    return this;
  }

  removeFromParent() {
    const node = this.parent;

    if (node.controllers && this.type in node.controllers) {
      const existing = node.controllers[this.type];
      if (existing) {
        delete node.controllers[this.type];
      }
    }
  }

  postMessage(data, callbacks) {
    throw 'Not implemented.';
  }
  postMessages(data, callbacks) {
    const { messages } = data;

    for (let i = 0; i < messages.length; ++i) {
      const message = messages[i];
      this.postMessage(message, callbacks);
    }
  }

  /* ===========================================================================} */
}

export { ControllerBase }
