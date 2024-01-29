import * as THREE from 'three'

import { ControllerBase } from './ControllerBase'

class ControllerAnimation extends ControllerBase {
  _animations = null;
  _mixer = null;

  _activeAction = null;
  _onFinished = null;

  constructor() {
    super();

    this._onFinished = [ ];
  }

  dispose() {
  }

  control(node, data, callbacks) {
    // Prepare.
    super.control(node, data, callbacks);

    const { clips } = data;
    const { onControllerApplied } = callbacks;

    // Initialize the data.
    this._target = node;
    const template = this._target.template;
    this._animations = template.animations;
    this._mixer = new THREE.AnimationMixer(this._target);
    this._actions = { };
    for (let i = 0; i < this._animations.length; ++i) {
      const clip = this._animations[i];
      const action = this._mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      this._actions[clip.name] = action;
    }

    if (typeof clips != 'undefined') {
      const setClipParams = (action, clip) => {
        if (clip.loop) {
          action.setLoop(THREE.LoopRepeat);
        } else {
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
        }
        action.weight = clip.weight || 1.0;
      };

      for (let i = 0; i < clips.length; ++i) {
        const clip = clips[i];
        if (clip.clip == '*') {
          for (let key in this._actions) {
            const action = this._actions[key];
            setClipParams(action, clip);
          }

          continue;
        }

        const action = this._actions[clip.clip];
        if (!action) {
          console.warn(`Ignored clip "${clip.clip}".`);

          continue;
        }

        setClipParams(action, clip);
      }
    }

    // Process the default animation.
    const default_ = data.default || { };
    const defaultClip = default_.clip || 'Idle';
    const defaultLoop = !!default_.loop;
    const defaultWeight = default_.weight || 1.0;
    if (defaultClip in this._actions) {
      const defaultAction = this._actions[defaultClip];
      if (defaultLoop) {
        defaultAction.setLoop(THREE.LoopRepeat);
      } else {
        defaultAction.setLoop(THREE.LoopOnce);
        defaultAction.clampWhenFinished = true;
      }
      defaultAction.weight = defaultWeight;
      defaultAction.reset().play();
      this._activeAction = defaultAction;
    }

    // Register the event handlers.
    this._mixer.addEventListener('finished', (event) => {
      this._onFinished.forEach((entry) => {
        const { handler } = entry;

        handler(event);
      });
    });

    // Finish.
    onControllerApplied?.({ node, data, controller: this });

    return this;
  }

  update(delta) {
    this._mixer.update(delta);

    return this;
  }

  _addAnimationFinishedEventHandler(clip, handler) {
    let idx = -1;
    for (let i = 0; i < this._onFinished.length; ++i) {
      const entry = this._onFinished[i];
      if (entry.clip == clip) {
        idx = i;

        break;
      }
    }

    if (idx >= 0)
      this._onFinished[idx].handler = handler;
    else
      this._onFinished.push({ clip, handler });

    return this;
  }
  _removeAnimationFinishedEventHandler(clip) {
    let idx = -1;
    for (let i = 0; i < this._onFinished.length; ++i) {
      const entry = this._onFinished[i];
      if (entry.clip == clip) {
        idx = i;

        break;
      }
    }

    if (idx >= 0)
      this._onFinished.splice(idx, 1);

    return this;
  }

  postMessage(data, callbacks) {
    const { message, index, clip, timeScale } = data;
    const { onReturned, onActed, onAnimationStarted, onAnimationFinished } = callbacks;

    if (message == 'GET_ACTIONS') {
      onReturned?.({ message, index, data, actions: this._actions });
    } else if (message == 'ACT') {
      const action = this._actions[clip];
      if (this._activeAction != action) {
        if (this._activeAction) {
          const previousAction = this._activeAction;
          previousAction.crossFadeTo(action, 0.333, true);
          this._activeAction = action;
          if (typeof timeScale == 'number') action.timeScale = timeScale;
          action.reset().play();

          onAnimationStarted?.({ clip: action._clip.name, action });

          this._addAnimationFinishedEventHandler(action._clip.name, (event) => {
            onAnimationFinished?.({ clip: action._clip.name, action });

            this._removeAnimationFinishedEventHandler(action._clip.name);
            this._activeAction.crossFadeTo(previousAction, 0.333, true);
            this._activeAction = previousAction;
            if (typeof timeScale == 'number') previousAction.timeScale = timeScale;
            previousAction.reset().play();

            onAnimationStarted?.({ clip: previousAction._clip.name, action: previousAction });
          });
        } else {
          this._activeAction = action;
          if (typeof timeScale == 'number') action.timeScale = timeScale;
          action.reset().play();

          onAnimationStarted?.({ clip: action._clip.name, action });

          this._addAnimationFinishedEventHandler(action._clip.name, (event) => {
            onAnimationFinished?.({ clip: action._clip.name, action });

            this._removeAnimationFinishedEventHandler(action._clip.name);
            this._activeAction = null;
          });
        }
      }

      onActed?.({ message, index, data, clip, action });
    } else if (message == 'ADD') {
      const action = this._actions[clip];
      if (this._activeAction) {
        if (typeof timeScale == 'number') action.timeScale = timeScale;
        action.reset().play();

        onAnimationStarted?.({ clip: action._clip.name, action });

        this._addAnimationFinishedEventHandler(action._clip.name, (event) => {
          onAnimationFinished?.({ clip: action._clip.name, action });

          this._removeAnimationFinishedEventHandler(action._clip.name);
        });
      }

      onActed?.({ message, index, data, clip, action });
    } else if (message == 'STOP') {
      let action = null;
      if (clip == '.')
        action = this._activeAction;
      else
        action = this._actions[clip];
      action.stop();

      if (this._activeAction == action)
        this._activeAction = null;

      onAnimationFinished?.({ clip: action._clip.name, action: action });

      onActed?.({ message, index, data, clip, action });
    } else {
      throw `Unknown message "${message}".`;
    }
  }
}

export { ControllerAnimation }
