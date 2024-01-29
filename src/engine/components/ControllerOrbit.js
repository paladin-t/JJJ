import { OrbitControls } from 'three/addons/controls/OrbitControls';

import { ControllerBase } from './ControllerBase'
import { Translator } from '../utils/Translator'

class ControllerOrbit extends ControllerBase {
  _controls = null;

  constructor() {
    super();
  }

  dispose() {
    if (this._controls) {
      this._controls.dispose();
      this._controls = null;
    }
  }

  control(node, data, callbacks) {
    super.control(node, data, callbacks);

    const {
      game,
      minDistance, maxDistance,
      minZoom, maxZoom,
      minTargetRadius, maxTargetRadius,
      minPolarAngle, maxPolarAngle,
      minAzimuthAngle, maxAzimuthAngle,
      enableDamping, dampingFactor,
      enableZoom, zoomSpeed,
      enableRotate, rotateSpeed,
      enablePan, panSpeed, screenSpacePanning, keyPanSpeed,
      zoomToCursor,
      autoRotate, autoRotateSpeed
    } = data;
    const { target } = Translator.getNumber3(data, 'target');
    const { cursor } = Translator.getNumber3(data, 'cursor');
    const canvas = game.get('#canvas');
    const { onControllerApplied } = callbacks;

    this._target = node;

    this._controls = new OrbitControls(node, canvas);
    this._controls.target.set(target[0], target[1], target[2]);
    this._controls.cursor?.set(cursor[0], cursor[1], cursor[2]);
    if (typeof minDistance        != 'undefined') this._controls.minDistance        = minDistance;
    if (typeof maxDistance        != 'undefined') this._controls.maxDistance        = maxDistance;
    if (typeof minZoom            != 'undefined') this._controls.minZoom            = minZoom;
    if (typeof maxZoom            != 'undefined') this._controls.maxZoom            = maxZoom;
    if (typeof minTargetRadius    != 'undefined') this._controls.minTargetRadius    = minTargetRadius;
    if (typeof minPolarAngle      != 'undefined') this._controls.minPolarAngle      = minPolarAngle;
    if (typeof maxPolarAngle      != 'undefined') this._controls.maxPolarAngle      = maxPolarAngle;
    if (typeof maxTargetRadius    != 'undefined') this._controls.maxTargetRadius    = maxTargetRadius;
    if (typeof minAzimuthAngle    != 'undefined') this._controls.minAzimuthAngle    = minAzimuthAngle;
    if (typeof maxAzimuthAngle    != 'undefined') this._controls.maxAzimuthAngle    = maxAzimuthAngle;
    if (typeof enableDamping      != 'undefined') this._controls.enableDamping      = enableDamping;
    if (typeof dampingFactor      != 'undefined') this._controls.dampingFactor      = dampingFactor;
    if (typeof enableZoom         != 'undefined') this._controls.enableZoom         = enableZoom;
    if (typeof zoomSpeed          != 'undefined') this._controls.zoomSpeed          = zoomSpeed;
    if (typeof enableRotate       != 'undefined') this._controls.enableRotate       = enableRotate;
    if (typeof rotateSpeed        != 'undefined') this._controls.rotateSpeed        = rotateSpeed;
    if (typeof enablePan          != 'undefined') this._controls.enablePan          = enablePan;
    if (typeof panSpeed           != 'undefined') this._controls.panSpeed           = panSpeed;
    if (typeof screenSpacePanning != 'undefined') this._controls.screenSpacePanning = screenSpacePanning;
    if (typeof keyPanSpeed        != 'undefined') this._controls.keyPanSpeed        = keyPanSpeed;
    if (typeof zoomToCursor       != 'undefined') this._controls.zoomToCursor       = zoomToCursor;
    if (typeof autoRotate         != 'undefined') this._controls.autoRotate         = autoRotate;
    if (typeof autoRotateSpeed    != 'undefined') this._controls.autoRotateSpeed    = autoRotateSpeed;

    onControllerApplied?.({ node, data, controller: this });

    return this;
  }

  update(delta) {
    this._controls.update(delta);

    return this;
  }
}

export { ControllerOrbit }
