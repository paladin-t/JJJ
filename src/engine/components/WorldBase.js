import * as THREE from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { USDZLoader } from 'three/addons/loaders/USDZLoader';

import { ControllerAnimation } from './ControllerAnimation'
import { ControllerOrbit } from './ControllerOrbit'
import { Retriever } from '../utils/Retriever'
import { Translator } from '../utils/Translator'

class WorldBase {
  /*
  ** {===========================================================================
  ** Protected fields
  */

  _canvas = null;
  _fbxLoader = null;
  _gltfLoader = null;
  _usdzLoader = null;
  _materialLoader = null;
  _texureLoader = null;
  _await = false;
  _clock = null;

  _allControllers = null;

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public fields
  */

  THREE = null;

  controllerFactory = {
    'animation': ControllerAnimation,
    'orbit'    : ControllerOrbit
  };

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Constructor
  */

  constructor({ canvas }) {
    this._canvas = canvas;
    this._clock = new THREE.Clock();

    this.THREE = THREE;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Public interfaces
  */

  /**< Registers external types. */

  registerControllerType(name, ctor) {
    this.controllerFactory[name] = ctor;

    return this;
  }

  /**< Retrieves the objects in the game world. */

  get(what) {
    switch (what) {
      case '#canvas':
        return this._canvas;
      case 'FbxLoader':
        return this._getFbxLoader();
      case 'GltfLoader':
        return this._getGltfLoader();
      case 'UsdzLoader':
        return this._getUsdzLoader();
      case 'MaterialLoader':
        return this._getMaterialLoader();
      case 'TextureLoader':
        return this._getTexureLoader();
      default:
        return null;
    }
  }
  find(what) {
    for (let i = 0; i < this._allControllers.length; ++i) {
      const controller = this._allControllers[i];
      if (controller.name == what)
        return controller;
    }

    return null;
  }
  query(where, start) {
    const queryByNames = (start_, where_) => {
      const parts = where_.split('.');
      if (parts.length == 0)
        return null;

      let node = start_;
      let i = 0;
      if (!node) {
        node = this.get(parts[0]);
        i = 1;
      }
      for (; i < parts.length; ++i) {
        if (parts[i] == 'geometry') {
          node = node.geometry;
        } else if (parts[i] == 'material') {
          node = node.material;
        } else if (parts[i] == 'controllers') {
          node = node.controllers;
        } else if (parts[i] == 'template') {
          node = node.template;
        } else if (typeof node == 'object' && !node.uuid) { // Is an array.
          node = node[parts[i]];
        } else {
          const children = node.children;
          let found = false;
          for (let j = 0; j < children.length; ++j) {
            const child = children[j];
            if (child.name == parts[i]) {
              found = true;
              node = child;

              break;
            }
          }
          if (!found)
            break;
        }
      }

      if (i == parts.length)
        return node;

      return null;
    };
    const queryByTag = (start_, where_) => {
      const children = start_.children;
      for (let j = 0; j < children.length; ++j) {
        const child = children[j];
        if (typeof child.userData?.tag != 'undefined' && child.userData?.tag == where_) {
          return child;
        }
      }
    };
    const queryByUuid = (start_, where_) => {
      const children = start_.children;
      for (let j = 0; j < children.length; ++j) {
        const child = children[j];
        if (typeof child.uuid != 'undefined' && child.uuid == where_) {
          return child;
        }
      }
    };
    const queryByType = (start_, where_) => {
      const children = start_.children;
      for (let j = 0; j < children.length; ++j) {
        const child = children[j];
        if (typeof child.type != 'undefined' && child.type == where_) {
          return child;
        }
      }
    };
    const queryByChildIndex = (start_, where_) => {
      return start_.children[where_];
    };

    if (typeof where == 'undefined' || where == 'null')
      return null;

    if (typeof where == 'string')
      return queryByNames(start, where);

    let node = start;
    where.forEach((where_) => {
      if (typeof where_ == 'string') {
        node = queryByNames(node, where_);
      } else if (typeof where_ == 'number') {
        node = queryByChildIndex(node, where_);
      } else if (typeof where_ == 'object') {
        const { byName, byTag, byUUID, byType, byIndex } = where_;

        if (typeof byName != 'undefined')
          node = queryByNames(node, byName);
        else if (typeof byTag != 'undefined')
          node = queryByTag(node, byTag);
        else if (typeof byUUID != 'undefined')
          node = queryByUuid(node, byTag);
        else if (typeof byType != 'undefined')
          node = queryByType(node, byTag);
        else if (typeof byIndex != 'undefined')
          node = queryByChildIndex(node, byIndex);
      }
    });

    return node;
  }

  /**< Manipulates the game world. */

  async execute(data, callbacks) {
    const { commands } = data;

    for (let i = 0; i < commands.length; ++i) {
      const data = commands[i];
      const { command, enabled } = data;

      if (typeof enabled != 'undefined' && !enabled)
        continue;

      switch (command) {
        case 'setup':
          await this.setup(data, callbacks);

          break;
        case 'load':
          await this.load(data, callbacks);

          break;
        case 'unload':
          await this.unload(data, callbacks);

          break;
        case 'control':
          await this.control(data, callbacks);

          break;
        case 'add':
          await this.add(data, callbacks);

          break;
        case 'animate':
          await this.animate(data, callbacks);

          break;
        default:
          throw `Unknown command "${command}".`;
      }
    }
  }

  async setup(data, callbacks) {
    const { enabled } = data;

    if (typeof enabled != 'undefined' && !enabled)
      return this;

    this._setup(data, callbacks);

    return this;
  }
  async load(data, callbacks) {
    const { enabled, where } = data;

    if (typeof enabled != 'undefined' && !enabled)
      return this;

    this._await = data.await;

    const node = this.query(where);

    if (data.nodes) {
      await this._loadTo(node, data, callbacks);

      this._await = undefined;
    } else {
      this._await = undefined;

      throw 'No available nodes data.';
    }

    return this;
  }
  async unload(data, callbacks) {
    const { enabled } = data;

    if (typeof enabled != 'undefined' && !enabled)
      return this;

    if (data.nodes) {
      await this._unloadFrom(data, callbacks);
    } else {
      throw 'No available nodes data.';
    }

    return this;
  }
  async control(data, callbacks) {
    const { enabled } = data;

    if (typeof enabled != 'undefined' && !enabled)
      return this;

    if (data.controllers) {
      this._applyController(data, callbacks);
    } else {
      throw 'No available controllers data.';
    }

    return this;
  }
  async add(data, callbacks) {
    const { enabled, where, what } = data;
    const { src, tag, format, castShadow, receiveShadow, material } = what;
    const srcWhere = what.where;
    const { onNodeAdded, onNodeError } = callbacks;

    if (typeof enabled != 'undefined' && !enabled)
      return this;

    const node = this.query(where);
    if (!node)
      throw `Invalid node "${where}".`;

    const dotIdx = src.lastIndexOf('.');
    const ext = typeof format != 'undefined' ? format : src.substr(dotIdx);
    let loader = null;
    switch (ext) {
      case '.fbx':
        loader = this._getFbxLoader();

        break;
      case '.glb': // Fall through.
      case '.gltf':
        loader = this._getGltfLoader();

        break;
      case '.usdz':
        loader = this._getUsdzLoader();

        break;
      default:
        throw `Unknown model loader for "${ext}";`;
    }

    return loader.loadAsync(src)
      .then(
        async (model) => {
          const newNode = model.scene ?? model;
          const newSub = this.query(srcWhere, newNode);
          if (typeof tag != 'undefined')
            newSub.userData.tag = tag;
          node.add(newSub);

          const skeleton = Retriever.findInChildren(node, 'skeleton');
          newSub.skeleton.bones = skeleton.bones;

          if (newSub.isMesh && newSub.material) {
            newSub.castShadow = !!castShadow;
            newSub.receiveShadow = !!receiveShadow;
            if (typeof material != 'undefined') {
              const parseParam = (data, key) => {
                const val = Translator.getMaterialData(data, key, this._getTexureLoader());
                if (typeof val != 'undefined') {
                  if (key == 'texture')
                    newSub.material['map'] = val;
                  else
                    newSub.material[key] = val;
                }
              };

              Translator.MATERIAL_PLAIN_ENTRIES.forEach((key) => {
                parseParam(material, key);
              });
              Translator.MATERIAL_VECTOR2_ENTRIES.forEach((key) => {
                parseParam(material, key);
              });
              Translator.MATERIAL_TEXTURE_ENTRIES.forEach((key) => {
                parseParam(material, key);
              });
            }
          }

          onNodeAdded?.({ node, sub: newSub, data });
        }
      )
      .catch(
        (err) => {
          onNodeError?.({ error: err, node, data });
        }
      );
  }
  async animate(data, callbacks) {
    const { enabled, where, what } = data;
    const { src, format } = what;
    const { onNodeAnimationAdded, onNodeError } = callbacks;

    if (typeof enabled != 'undefined' && !enabled)
      return this;

    const node = this.query(where);
    if (!node)
      throw `Invalid node "${where}".`;

    const dotIdx = src.lastIndexOf('.');
    const ext = typeof format != 'undefined' ? format : src.substr(dotIdx);
    let loader = null;
    switch (ext) {
      case '.fbx':
        loader = this._getFbxLoader();

        break;
      case '.glb': // Fall through.
      case '.gltf':
        loader = this._getGltfLoader();

        break;
      case '.usdz':
        loader = this._getUsdzLoader();

        break;
      default:
        throw `Unknown model loader for "${ext}";`;
    }

    return loader.loadAsync(src)
      .then(
        async (model) => {
          let newAnim = model.animations;
          let newNode = model;
          if (!newAnim) {
            model.traverse((sub_) => {
              if (newAnim)
                return;

              if (sub_.animations) {
                newNode = sub_;
                newAnim = sub_.animations;
              }
            });
          }
          if (newNode.scene)
            newNode = newNode.scene;

          const findAnim = (name) => {
            for (let i = 0; i < node.template.animations.length; ++i) {
              const anim = node.template.animations[i];
              if (anim.name == name)
                return anim;
            }

            return null;
          };
          newAnim.forEach((anim) => {
            while (findAnim(anim.name))
              anim.name = anim.name + '_Copy';
            node.template.animations.push(anim);
          });

          onNodeAnimationAdded?.({ animations: node.template.animations, data });
        }
      )
      .catch(
        (err) => {
          onNodeError?.({ error: err, node, data });
        }
      );
  }

  /**< Updates the game worlds. */

  update() {
    const delta = this._clock.getDelta();

    if (this._allControllers) {
      this._allControllers.forEach((controller) => {
        controller.update(delta);
      });
    }

    return this;
  }

  /**< Communicates with the objects in the game world. */

  postMessage(where, data, callbacks) {
    const node = this.query(where);
    if (!node) {
      throw `Invalid node "${where}".`;
    }

    node.postMessage({ ...data, index: 0 }, callbacks);

    return this;
  }
  postMessages(where, data, callbacks) {
    const { messages } = data;

    const node = this.query(where);
    if (!node)
      throw `Invalid node "${where}".`;

    for (let i = 0; i < messages.length; ++i) {
      const message = { ...messages[i], index: i };
      messages[i] = message;
    }
    node.postMessages(data, callbacks);

    return this;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Internal interfaces
  */

  /**< Manipulates the game world. */

  _setup(data, callbacks) {
    throw 'Not implemented';
  }

  async _loadTo(parent, data, callbacks = { }) {
    const { nodes } = data;
    const await_ = this._await;
    const { onNodePending } = callbacks;

    const promises = [ ];

    for (let i = 0; i < nodes.length; ++i) {
      const node = nodes[i];
      switch (node.type) {
        case 'object3d':
          await this._loadObject3DNode(parent, node, i, callbacks);

          break;
        case 'ambient_light':
          await this._loadAmbientLightNode(parent, node, i, callbacks);

          break;
        case 'hemi_light':
          await this._loadHemiLightNode(parent, node, i, callbacks);

          break;
        case 'directional_light':
          await this._loadDirectionalLightNode(parent, node, i, callbacks);

          break;
        case 'model':
          const p = this._loadModelNode(parent, node, i, callbacks);
          onNodePending?.({ promise: p, parent, data: node, index: i });
          if (await_)
            promises.push(p);
  
          break;
        case 'geometry':
          await this._loadGeometryNode(parent, node, i, callbacks);

          break;
        default:
          throw `Unknown node type "${node.type}".`;
      }
    }

    return await Promise.all(promises);
  }
  async _unloadFrom(data, callbacks = { }) {
    const { nodes } = data;
    const { onNodeUnloaded } = callbacks;

    for (let i = 0; i < nodes.length; ++i) {
      const node_ = nodes[i];
      const { where } = node_;

      const node = this.query(where);
      if (!node)
        throw `Invalid node "${where}".`;

      if (node.isObject3D) {
        const tobeDisposed = [ ];
        node.traverse((sub_) => {
          tobeDisposed.push(sub_);
        });
        tobeDisposed.forEach((sub_) => {
          sub_.removeFromParent();
        });
        tobeDisposed.forEach((sub_) => {
          sub_.material?.dispose?.();
          sub_.dispose?.();
        });
        node.removeFromParent();
        node?.material?.dispose?.();
        node?.geometry?.dispose?.();
        node.dispose?.();

        onNodeUnloaded?.({ node, data: node_, index: i });
      } else if (node.isController) {
        const removed = this._removeController(node);

        node.removeFromParent();
        node.dispose?.();

        onControllerRemoved?.({ node, data, controller: removed[0] });
      } else {
        throw `Unknown node "${node}".`;
      }
    }
  }

  async _loadObject3DNode(parent, data, index, callbacks) {
    const { name, visible, tag, children } = data;
    const { onNodeLoaded } = callbacks;
    const { position, scale, rotation } = Translator.getTransform(data);

    const node = new THREE.Object3D();
    node.name = name || index.toString();
    node.position.set(position[0], position[1], position[2]);
    node.scale.set(scale[0], scale[1], scale[2]);
    node.rotation.set(rotation[0], rotation[1], rotation[2]);
    node.visible = visible;
    if (typeof tag != 'undefined')
      node.userData.tag = tag;
    parent.add(node);

    if (typeof children != 'undefined' && children) await this._loadTo(node, { nodes: children }, callbacks);

    onNodeLoaded?.({ parent, node, data, index });

    return this;
  }
  async _loadAmbientLightNode(parent, data, index, callbacks) {
    const { name, color, intensity, visible, tag, children } = data;
    const { onNodeLoaded } = callbacks;

    const node = new THREE.AmbientLight(color, intensity);
    node.name = name || index.toString();
    node.visible = visible;
    if (typeof tag != 'undefined')
      node.userData.tag = tag;
    parent.add(node);

    if (typeof children != 'undefined' && children) await this._loadTo(node, { nodes: children }, callbacks);

    onNodeLoaded?.({ parent, node, data, index });

    return this;
  }
  async _loadHemiLightNode(parent, data, index, callbacks) {
    const { name, skyColor, groundColor, intensity, visible, tag, children } = data;
    const { onNodeLoaded } = callbacks;
    const { position } = Translator.getTransform(data);

    const node = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    node.name = name || index.toString();
    node.position.set(position[0], position[1], position[2]);
    node.visible = visible;
    if (typeof tag != 'undefined')
      node.userData.tag = tag;
    parent.add(node);

    if (typeof children != 'undefined' && children) await this._loadTo(node, { nodes: children }, callbacks);

    onNodeLoaded?.({ parent, node, data, index });

    return this;
  }
  async _loadDirectionalLightNode(parent, data, index, callbacks) {
    const { name, color, intensity, castShadow, visible, tag, children } = data;
    let { shadow } = data;
    const { onNodeLoaded } = callbacks;
    const { position } = Translator.getTransform(data);
    const { target } = Translator.getNumber3(data, 'target');

    const node = new THREE.DirectionalLight(color, intensity);
    node.name = name || index.toString();
    node.position.set(position[0], position[1], position[2]);
    node.target.position.set(target[0], target[1], target[2]);
    node.visible = visible;
    if (typeof tag != 'undefined')
      node.userData.tag = tag;
    parent.add(node);

    node.castShadow = !!castShadow;
    shadow = shadow || { };
    node.shadow.camera.top     = shadow.top       || 2;
    node.shadow.camera.bottom  = shadow.bottom    || -2;
    node.shadow.camera.left    = shadow.left      || -2;
    node.shadow.camera.right   = shadow.right     || 2;
    node.shadow.camera.near    = shadow.near      || 0.01;
    node.shadow.camera.far     = shadow.far       || 10;
    node.shadow.bias           = shadow.bias      || 0.001;
    node.shadow.mapSize.width  = shadow.mapWidth  || 1024;
    node.shadow.mapSize.height = shadow.mapHeight || 1024;

    if (typeof children != 'undefined' && children) await this._loadTo(node, { nodes: children }, callbacks);

    onNodeLoaded?.({ parent, node, data, index });

    return this;
  }
  async _loadModelNode(parent, data, index, callbacks) {
    const { name, src, format, tag, castShadow, receiveShadow, material, visible, children } = data;
    const { onNodeLoaded, onNodeError } = callbacks;
    const { position, scale, rotation } = Translator.getTransform(data);

    const dotIdx = src.lastIndexOf('.');
    const ext = typeof format != 'undefined' ? format : src.substr(dotIdx);
    let loader = null;
    switch (ext) {
      case '.fbx':
        loader = this._getFbxLoader();

        break;
      case '.glb': // Fall through.
      case '.gltf':
        loader = this._getGltfLoader();

        break;
      case '.usdz':
        loader = this._getUsdzLoader();

        break;
      default:
        throw `Unknown model loader for "${ext}";`;
    }

    return loader.loadAsync(src)
      .then(
        async (model) => {
          const node = model.scene ?? model;
          node.template = model;
          node.name = name || index.toString();
          node.position.set(position[0], position[1], position[2]);
          node.scale.set(scale[0], scale[1], scale[2]);
          node.rotation.set(rotation[0], rotation[1], rotation[2]);
          node.visible = visible;
          if (typeof tag != 'undefined')
            node.userData.tag = tag;
          parent.add(node);

          node.castShadow = !!castShadow;
          node.receiveShadow = !!receiveShadow;
          node.traverse((sub) => {
            if (sub.isMesh && sub.material) {
              sub.castShadow = !!castShadow;
              sub.receiveShadow = !!receiveShadow;
              if (typeof material != 'undefined') {
                const parseParam = (data, key) => {
                  const val = Translator.getMaterialData(data, key, this._getTexureLoader());
                  if (typeof val != 'undefined') {
                    if (key == 'texture')
                      sub.material['map'] = val;
                    else
                      sub.material[key] = val;
                  }
                };

                Translator.MATERIAL_PLAIN_ENTRIES.forEach((key) => {
                  parseParam(material, key);
                });
                Translator.MATERIAL_VECTOR2_ENTRIES.forEach((key) => {
                  parseParam(material, key);
                });
                Translator.MATERIAL_TEXTURE_ENTRIES.forEach((key) => {
                  parseParam(material, key);
                });
              }
            }
          });

          if (typeof children != 'undefined' && children) await this._loadTo(node, { nodes: children }, callbacks);

          onNodeLoaded?.({ parent, node, data, index });
        }
      )
      .catch(
        (err) => {
          onNodeError?.({ error: err, parent, data, index });
        }
      );
  }
  async _loadGeometryNode(parent, data, index, callbacks) {
    const {
      name, geometry,
      visible, width, height, depth, widthSegments, heightSegments, depthSegments,
      tag,
      castShadow, receiveShadow,
      material,
      children
    } = data;
    const { onNodeLoaded, onMaterialLoaded } = callbacks;
    const { position, scale, rotation } = Translator.getTransform(data);

    let geo = null;
    switch (geometry) {
      case 'plane':
        geo = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);

        break;
      case 'box':
        geo = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);

        break;
      default:
        throw `Unknown geometry type "${geometry}".`;
    }
    const mat = this._loadMaterial(material || { });
    const node = new THREE.Mesh(geo, mat);
    node.name = name || index.toString();
    node.position.set(position[0], position[1], position[2]);
    node.scale.set(scale[0], scale[1], scale[2]);
    node.rotation.set(rotation[0], rotation[1], rotation[2]);
    node.visible = visible;
    if (typeof tag != 'undefined')
      node.userData.tag = tag;
    parent.add(node);

    node.castShadow = !!castShadow;
    node.receiveShadow = !!receiveShadow;

    if (typeof children != 'undefined' && children) await this._loadTo(node, { nodes: children }, callbacks);

    onMaterialLoaded?.({ node, data: material, material: mat, index });
    onNodeLoaded?.({ parent, node, data, index });

    return this;
  }

  _loadMaterial(data) {
    const { name } = data;
    let { type } = data;

    if (type == 'json') {
      let data_ = data.data;
      const mat = this._getMaterialLoader()
        .parse(data_);

      mat.name = name || '';

      return mat;
    }

    if (typeof type == 'undefined') type = 'basic';

    let params = { }
    const parseParam = (data, key) => {
      const val = Translator.getMaterialData(data, key, this._getTexureLoader());
      if (typeof val != 'undefined') {
        if (key == 'texture')
          params['map'] = val;
        else
          params[key] = val;
      }
    };

    Translator.MATERIAL_PLAIN_ENTRIES.forEach((key) => {
      parseParam(data, key);
    });
    Translator.MATERIAL_VECTOR2_ENTRIES.forEach((key) => {
      parseParam(data, key);
    });
    Translator.MATERIAL_TEXTURE_ENTRIES.forEach((key) => {
      parseParam(data, key);
    });

    let mat = null;
    switch (type) {
      case undefined: // Fall through.
      case null: // Fall through.
      case 'basic':
        mat = new THREE.MeshBasicMaterial(params);

        break;
      case 'standard':
        mat = new THREE.MeshStandardMaterial(params);

        break;
      case 'lambert':
        mat = new THREE.MeshLambertMaterial(params);

        break;
      case 'phong':
        mat = new THREE.MeshPhongMaterial(params);

        break;
      case 'physical':
        mat = new THREE.MeshPhysicalMaterial(params);

        break;
      case 'toon':
        mat = new THREE.MeshToonMaterial(params);

        break;
      case 'shadow':
        mat = new THREE.ShadowMaterial(params);

        break;
      case 'shader':
        mat = new THREE.ShaderMaterial(params);

        break;
      default:
        throw `Unknown material type "${type}".`;
    }

    mat.name = name || '';

    return mat;
  }

  _applyController(data, callbacks = { }) {
    const { controllers } = data;
    const { onControllerRemoved } = callbacks;

    for (let i = 0; i < controllers.length; ++i) {
      const data = controllers[i];
      const { where, name } = data;

      const node = this.query(where);
      if (!node)
        throw `Invalid node "${where}".`;

      if (data.type in this.controllerFactory) {
        if (node.controllers && data.type in node.controllers) {
          const existing = node.controllers[data.type];
          if (existing) {
            const removed = this._removeController(existing);

            existing.removeFromParent();
            existing.dispose();

            onControllerRemoved?.({ node, data, controller: removed[0] });
          }
        }

        const klass = this.controllerFactory[data.type];
        const controller = new klass();
        controller.name = name || i.toString();
        if (!node.controllers)
          node.controllers = { };
        node.controllers[data.type] = controller;
        controller.control(node, { ...data, game: this }, callbacks);

        if (!this._allControllers)
          this._allControllers = [ ];
        this._allControllers.push(controller);
      } else {
        throw `Unknown controller type "${data.type}".`;
      }
    }

    return this;
  }
  _removeController(controller) {
    const idx = this._allControllers.indexOf(controller);
    if (idx == -1)
      return [ null ];

    return this._allControllers.splice(idx, 1);
  }

  /**< Helper functions. */

  _getFbxLoader() {
    if (!this._fbxLoader)
      this._fbxLoader = new FBXLoader();

    return this._fbxLoader;
  }
  _getGltfLoader() {
    if (!this._gltfLoader)
      this._gltfLoader = new GLTFLoader();

    return this._gltfLoader;
  }
  _getUsdzLoader() {
    if (!this._usdzLoader)
      this._usdzLoader = new USDZLoader();

    return this._usdzLoader;
  }
  _getMaterialLoader() {
    if (!this._materialLoader)
      this._materialLoader = new THREE.MaterialLoader();

    return this._materialLoader;
  }
  _getTexureLoader() {
    if (!this._texureLoader)
      this._texureLoader = new THREE.TextureLoader();

    return this._texureLoader;
  }

  /* ===========================================================================} */

  /*
  ** {===========================================================================
  ** Event handlers
  */

  onResized(width, height) {
  }

  onKeyDown(key) {
  }
  onKeyUp(key) {
  }

  onMouseDown(x, y) {
  }
  onMouseUp(x, y) {
  }
  onMouseMove(x, y) {
  }

  /* ===========================================================================} */
}

export { WorldBase }
