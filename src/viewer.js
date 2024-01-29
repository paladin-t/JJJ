import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter';
import { GUI } from 'three/addons/libs/lil-gui.module.min';
import Stats from 'three/addons/libs/stats.module';

import { WEBGL } from './webgl'
import { Game } from './engine/Game'

if (WEBGL.isWebGLAvailable()) {
  // Parse the arguments.
  const getArg = (what) => {
    let arg = null;
    const pattern = `${what}=`;
    const argIndex = args.indexOf(pattern);
    if (argIndex == -1) {
      arg = '';
    } else {
      let endIndex = args.indexOf('&', argIndex); if (endIndex == -1) endIndex = args.length;
      arg = args.substr(argIndex + pattern.length, endIndex - argIndex - pattern.length);
      const first = args.substr(0, argIndex);
      const second = args.substr(endIndex + 1);
      args = first + second;
    }

    return arg;
  };

  const search = window.location.search || '';
  console.log('?', search);
  let args = search || '';
  if (args && args[0] == '?') args = args.substr(1);
  let renderer = getArg('renderer');
  if (!renderer || renderer == '') renderer = 'default';
  console.log(`Renderer: ${renderer}.`);

  // Initialize the world.
  const canvas = document.getElementById('canvas');
  const game = new Game({
    mode: 'default',
    canvas
  });
  const world = game.get('#world');
  const callbacks = {
    onWorldSetup: (what) => {
      console.log('Setup world', what);
    },

    onNodePending: (what) => {
      console.log('Node pending', what);
    },
    onNodeLoaded: (what) => {
      console.log('Loaded node', what);
    },
    onNodeUnloaded: (what) => {
      console.log('Unloaded node', what);
    },
    onNodeAdded: (what) => {
      console.log('Added node', what);
    },
    onNodeAnimationAdded: (what) => {
      console.log('Node animation added', what);
    },
    onNodeError: (what) => {
      console.log('Node error', what);
    },
    onMaterialLoaded: (what) => {
      console.log('Loaded material', what);
    },

    onControllerApplied: (what) => {
      console.log('Controller applied', what);
    },
    onControllerRemoved: (what) => {
      console.log('Controller removed', what);
    }
  };
  await world
    .execute(
      {
        "commands": [
          {
            "command": "setup", // Setup the basic modules.
            "renderer": [
              {
                "type": renderer,
                "outputColorSpace": THREE.SRGBColorSpace,
                "width": window.innerWidth, "height": window.innerHeight,
                "pixelRatio": window.devicePixelRatio,
                "enableShadow": true,
                "shadowType": THREE.PCFShadowMap,
                "options": null
              }
            ],
            "camera": {
              "type": "perspective",
              "aspect": 60,
              "near": 0.1, "far": 100,
              "position": [ 0, 1.8, 3 ],
              "target": [ 0, 1, 0 ]
            }
          },

          {
            "command": "load", // Load the initial scene graph.
            "where": "#scene",
            "await": true,
            "nodes": [
              {
                "type": "hemi_light",
                "skyColor": 0xcccccc, "groundColor": 0x444444, "intensity": 2.0,
                "position": [ 0, 0, 0 ]
              },
              {
                "type": "ambient_light",
                "color": 0xffffff, "intensity": 1.0
              },
              {
                "type": "directional_light",
                "color": 0xffffff, "intensity": 1.5,
                "position": [ 1, 2.5, 1 ],
                "target": [ 0, 0, 0 ],
                "castShadow": true,
                "shadow": {
                  "top": 2, "bottom": -2,
                  "left": -2, "right": 2,
                  "near": 0.01, "far": 10,
                  "bias": 0.001,
                  "mapWidth": 2048, "mapHeight": 2048
                }
              },
              {
                "type": "object3d",
                "name": "AvatarRoot",
                "position": [ 0, 0, 0 ],
                "scale": [ 1, 1, 1 ],
                "rotation": [ 0, 0, 0 ]
              },
              {
                "type": "geometry",
                "name": "Ground",
                "geometry": "plane",
                "width": 100, "height": 100, "widthSegments": 1, "heightSegments": 1,
                "position": [ 0, -0.01, 0 ],
                "rotation": [ -Math.PI / 2, 0, 0 ],
                "receiveShadow": true,
                "material": {
                  "type": "shadow",
                  "opacity": 0.5
                }
              },
              {
                "type": "geometry",
                "name": "Background1",
                "geometry": "plane",
                "width": 5, "height": 5, "widthSegments": 1, "heightSegments": 1,
                "position": [ 0, 2.48, -2 ],
                "rotation": [ 0, 0, 0 ],
                "receiveShadow": false,
                "material": {
                  "type": "basic",
                  "texture": {
                    "src": "images/wall.png",
                    "minFilter": THREE.LinearFilter,
                    "magFilter": THREE.LinearFilter
                  },
                  "transparent": true
                },
                "children": [
                  {
                    "type": "geometry",
                    "name": "Background2",
                    "geometry": "plane",
                    "visible": true,
                    "width": 5, "height": 5, "widthSegments": 1, "heightSegments": 1,
                    "position": [ 0, -2.5, 2 ],
                    "rotation": [ -Math.PI * 0.5, 0, 0 ],
                    "receiveShadow": false,
                    "material": {
                      "type": "basic",
                      "texture": {
                        "src": "images/ground.png",
                        "minFilter": THREE.LinearFilter,
                        "magFilter": THREE.LinearFilter
                      },
                      "transparent": true
                    }
                  }
                ]
              }
            ]
          },

          {
            "command": "control", // Apply controllers to the scene graph.
            "controllers": [
              {
                "where": "#camera",
                "name": "CameraZoomController",
                "type": "orbit",
                "target": [ 0, 1.5, 0.001 ],
                "enableDamping": false,
                "enableZoom": true,
                "minDistance": 0.5, "maxDistance": 5,
                "enableRotate": false,
                "enablePan": false
              },
              {
                "where": "#scene.AvatarRoot",
                "name": "AvatarRotationController",
                "type": "orbit",
                "target": [ 0, 0, 0.001 ],
                "enableDamping": true, "dampingFactor": 0.05,
                "enableZoom": false,
                "rotateSpeed": -1,
                "maxPolarAngle": Math.PI / 2, "minPolarAngle": Math.PI / 2
              }
            ]
          }
        ]
      },
      callbacks
    );

  // Load the avatar.
  const loadAvatar = async ({ canvas, game, world, callbacks, src, fileName }) => {
    // Prepare.
    const result = { };

    const controlGui = new GUI({ width: 300 });
    if (window.innerWidth >= 800)
      controlGui.open();
    else
      controlGui.close();

    const settings = {
      basic: null,
      bloom: null,
      toon: null,

      wireframe: false,
      skeleton: false,

      translateX: 0, translateY: 0, translateZ: 0,
      rotationX: 0, rotationY: 0, rotationZ: 0,
      scale: 1.0,

      append: null,

      open: null,
      reset: null,

      export: null
    };
    const exporterSettings = {
      useParent: false,
      trs: false,
      onlyVisible: false,
      binary: true,
      maxTextureSize: 4096,
      includeAnimations: true
    };

    const getFormat = (src, fileName) => {
      let ext = '.glb';
      if (fileName) {
        let dotIdx = fileName.lastIndexOf('.');
        if (dotIdx >= 0) {
          ext = fileName.substr(dotIdx);
        } else {
          dotIdx = src.lastIndexOf('.');
          ext = src.substr(dotIdx);
        }
      } else {
        const dotIdx = src.lastIndexOf('.');
        ext = src.substr(dotIdx);
      }

      return ext;
    };

    // Load the model.
    await world
      .execute(
        {
          "commands": [
            {
              "command": "load",
              "await": true,
              "where": "#scene.AvatarRoot",
              "nodes": [
                {
                  "type": "model",
                  "name": "Avatar",
                  "src": src,
                  "format": getFormat(src, fileName),
                  "position": [ 0, 0, 0 ],
                  "scale": [ 1, 1, 1 ],
                  "rotation": [ 0, 0, 0 ],
                  "castShadow": true,
                  "material": {
                    // "depthWrite": true,
                    // "metalness": 0.1
                  }
                }
              ]
            }
          ]
        },
        {
          ...callbacks,
          onNodeError: (what) => {
            console.log('Node error', what);

            const fileFolder = controlGui.addFolder('File');
            fileFolder.open();
            settings['open'] = () => {
              const inputElement = document.createElement('input');
              inputElement.type = 'file';
              inputElement.addEventListener('change', async function (event) {
                if (!this.files || this.files.length == 0)
                  return;

                const file = this.files[0];
                const url = URL.createObjectURL(file);
                if (skeleton)
                  skeleton.removeFromParent();
                avatar.removeFromParent();
                controlGui.close();
                await loadAvatar({ canvas, game, world, callbacks, src: url, fileName: file.name });
              });
              inputElement.dispatchEvent(new MouseEvent('click'));
            };
            fileFolder.add(settings, 'open').name('Open');
            settings['reset'] = async () => {
              if (skeleton)
                skeleton.removeFromParent();
              avatar.removeFromParent();
              controlGui.close();
              await loadAvatar({ canvas, game, world, callbacks, src: 'models/xbot.glb', fileName: null });
            };
            fileFolder.add(settings, 'reset').name('Reset');
          }
        }
      );

    // Apply the animation controller.
    result.controlAnimation = async (callbacks) => {
      await world
        .execute(
          {
            "commands": [
              {
                "command": "control",
                "controllers": [
                  {
                    "where": "#scene.AvatarRoot.Avatar",
                    "name": "AvatarAnimationController",
                    "type": "animation",
                    "default": {
                      "clip": "idle",
                      "loop": true,
                      "weight": 1
                    },
                    "clips": [
                      {
                        "clip": "*",
                        "loop": true,
                        "weight": 1
                      },
                      {
                        "clip": "idle",
                        "loop": true,
                        "weight": 1
                      },
                      {
                        "clip": "run",
                        "loop": true,
                        "weight": 1
                      },
                      {
                        "clip": "walk",
                        "loop": true,
                        "weight": 1
                      },
                      {
                        "clip": "talk",
                        "loop": true,
                        "weight": 1
                      }
                    ]
                  }
                ]
              }
            ]
          },
          callbacks
        );
    };
    await result.controlAnimation({ });

    // Calculate the objects, vertices, triangles...
    const scene = world.query('#scene');
    const avatar = world.query('#scene.AvatarRoot.Avatar');
    let skeleton = null;
    let objects = 0;
    let vertices = 0;
    let triangles = 0;
    avatar.traverseVisible((sub) => {
      ++objects;
      if (sub.isMesh) {
        const geometry = sub.geometry;
        vertices += geometry.attributes.position.count;
        if (geometry.index != null)
          triangles += geometry.index.count / 3;
        else
          triangles += geometry.attributes.position.count / 3;
      }
    });
    const tips = document.getElementById('tips');
    tips.innerHTML = `Objects: ${objects}<br>Vertices: ${vertices}<br>Triangles: ${triangles}`;

    console.warn('Avatar', avatar);

    // Setup the renderer widgets.
    const rendererFolder = controlGui.addFolder('Renderer');
    rendererFolder.close();
    settings['basic'] = async () => {
      await world
        .execute(
          {
            "commands": [
              {
                "command": "setup",
                "renderer": [
                  {
                    "type": 'basic',
                    "outputColorSpace": THREE.SRGBColorSpace,
                    "width": window.innerWidth, "height": window.innerHeight,
                    "pixelRatio": window.devicePixelRatio,
                    "enableShadow": true,
                    "shadowType": THREE.PCFShadowMap,
                    "options": null
                  }
                ]
              }
            ]
          },
          callbacks
        );
    };
    rendererFolder.add(settings, 'basic').name('Basic');
    settings['bloom'] = async () => {
      await world
        .execute(
          {
            "commands": [
              {
                "command": "setup",
                "renderer": [
                  {
                    "type": 'bloom',
                    "outputColorSpace": THREE.SRGBColorSpace,
                    "width": window.innerWidth, "height": window.innerHeight,
                    "pixelRatio": window.devicePixelRatio,
                    "enableShadow": true,
                    "shadowType": THREE.PCFShadowMap,
                    "options": null
                  }
                ]
              }
            ]
          },
          callbacks
        );
    };
    rendererFolder.add(settings, 'bloom').name('Bloom');
    settings['toon'] = async () => {
      await world
        .execute(
          {
            "commands": [
              {
                "command": "setup",
                "renderer": [
                  {
                    "type": 'toon',
                    "outputColorSpace": THREE.SRGBColorSpace,
                    "width": window.innerWidth, "height": window.innerHeight,
                    "pixelRatio": window.devicePixelRatio,
                    "enableShadow": true,
                    "shadowType": THREE.PCFShadowMap,
                    "options": null
                  }
                ]
              }
            ]
          },
          callbacks
        );
    };
    rendererFolder.add(settings, 'toon').name('Toon');

    // Setup the basic widgets.
    controlGui.add(settings, 'wireframe').name('Wireframe')
      .onChange(() => {
        avatar.traverse((sub) => {
          if (sub.isMesh && sub.material) {
            sub.material.wireframe = settings.wireframe;
          }
        });
      });
    controlGui.add(settings, 'skeleton').name('Skeleton')
      .onChange(() => {
        if (settings.skeleton) {
          if (!skeleton) {
            const helper = new THREE.SkeletonHelper(avatar);
            scene.add(helper);
            skeleton = helper;
          }
        } else {
          skeleton.removeFromParent();
          skeleton = null;
        }
      });

    // Setup the transform widgets.
    const transformFolder = controlGui.addFolder('Transform');
    transformFolder.close();
    transformFolder.add(settings, 'translateX', -3, 3, 0.1).name('X')
      .onChange(() => {
        avatar.position.set(settings.translateX, settings.translateY, settings.translateZ);
      });
    transformFolder.add(settings, 'translateY', -3, 3, 0.1).name('Y')
      .onChange(() => {
        avatar.position.set(settings.translateX, settings.translateY, settings.translateZ);
      });
    transformFolder.add(settings, 'translateZ', -3, 3, 0.1).name('Z')
      .onChange(() => {
        avatar.position.set(settings.translateX, settings.translateY, settings.translateZ);
      });
    transformFolder.add(settings, 'rotationX', -3, 3, 0.1).name('θx')
      .onChange(() => {
        avatar.rotation.set(settings.rotationX, settings.rotationY, settings.rotationZ);
      });
    transformFolder.add(settings, 'rotationY', -3, 3, 0.1).name('θy')
      .onChange(() => {
        avatar.rotation.set(settings.rotationX, settings.rotationY, settings.rotationZ);
      });
    transformFolder.add(settings, 'rotationZ', -3, 3, 0.1).name('θz')
      .onChange(() => {
        avatar.rotation.set(settings.rotationX, settings.rotationY, settings.rotationZ);
      });
    transformFolder.add(settings, 'scale', 0.001, 2, 0.01).name('Scale')
      .onChange(() => {
        avatar.scale.set(settings.scale, settings.scale, settings.scale);
      });

    // Setup the animation widgets.
    const animationFolder = controlGui.addFolder('Animations');
    animationFolder.open();

    let appendButton = null;
    let playFolder = null;
    let loopFolder = null;
    let weightFolder = null;
    let renameFolder = null;
    result.refreshAnimations = () => {
      world
        .postMessage(
          "#scene.AvatarRoot.Avatar.controllers.animation",
          {
            "message": "GET_ACTIONS"
          },
          {
            onReturned: (data) => {
              console.log('Got actions', data);

              const { actions } = data;

              appendButton?.destroy();
              playFolder?.destroy();
              loopFolder?.destroy();
              weightFolder?.destroy();
              renameFolder?.destroy();

              settings['append'] = async () => {
                const inputElement = document.createElement('input');
                inputElement.type = 'file';
                inputElement.addEventListener('change', async function (event) {
                  if (!this.files || this.files.length == 0)
                    return;

                  const file = this.files[0];
                  const url = URL.createObjectURL(file);
                  const fileName = file.name;
                  await world
                    .execute(
                      {
                        "commands": [
                          {
                            "command": "animate",
                            "where": "#scene.AvatarRoot.Avatar",
                            "what": {
                              "src": url,
                              "format": getFormat(src, fileName)
                            }
                          }
                        ]
                      },
                      callbacks
                    );
                  await result.controlAnimation({
                    ...callbacks,
                    onControllerApplied: (what) => {
                      console.log('Controller applied', what);

                      result.refreshAnimations();
                    }
                  });
                });
                inputElement.dispatchEvent(new MouseEvent('click'));
              };
              appendButton = animationFolder.add(settings, 'append').name('Append');

              playFolder = animationFolder.addFolder('Play');
              playFolder.open();
              const animations = { };
              for (const key in actions) {
                const action = actions[key];
                animations[key] = action.isRunning();

                playFolder.add(animations, key).name(key)
                  .onChange(() => {
                    if (animations[key]) {
                      action.reset().play();
                    } else {
                      action.stop();
                    }
                  });
              }

              loopFolder = animationFolder.addFolder('Loop');
              loopFolder.close();
              const loop = { };
              for (const key in actions) {
                const action = actions[key];
                loop[key] = action.loop == THREE.LoopRepeat;

                loopFolder.add(loop, key).name(key)
                  .onChange(() => {
                    if (loop[key]) {
                      action.setLoop(THREE.LoopRepeat);
                    } else {
                      action.setLoop(THREE.LoopOnce);
                      action.clampWhenFinished = true;
                    }

                    if (animations[key]) {
                      action.reset().play();
                    }
                  });
              }

              weightFolder = animationFolder.addFolder('Weight');
              weightFolder.close();
              const weight = { };
              for (const key in actions) {
                const action = actions[key];
                weight[key] = action.weight;

                weightFolder.add(weight, key, 0, 1, 0.05).name(key)
                  .onChange(() => {
                    action.weight = weight[key];
                  });
              }

              renameFolder = animationFolder.addFolder('Rename');
              renameFolder.close();
              const renaming = { };
              for (const key in actions) {
                const action = actions[key];

                renaming[key] = () => {
                  const name = prompt('Please input new name', key);
                  if (!name)
                    return;
                  if (name == key)
                    return;
                  if (name in actions) {
                    alert(`The specified name \"${name}\" already exists.`);

                    return;
                  }

                  delete actions[key];
                  action._clip.name = name;
                  actions[name] = action;
                  result.refreshAnimations();
                };
                renameFolder.add(renaming, key).name(`Rename \"${key}\"`);
              }
            }
          }
        );
    };
    result.refreshAnimations();

    const fileFolder = controlGui.addFolder('File');
    fileFolder.open();
    settings['open'] = () => {
      const inputElement = document.createElement('input');
      inputElement.type = 'file';
      inputElement.addEventListener('change', async function (event) {
        if (!this.files || this.files.length == 0)
          return;

        const file = this.files[0];
        const url = URL.createObjectURL(file);
        if (skeleton)
          skeleton.removeFromParent();
        avatar.removeFromParent();
        controlGui.close();
        await loadAvatar({ canvas, game, world, callbacks, src: url, fileName: file.name });
      });
      inputElement.dispatchEvent(new MouseEvent('click'));
    };
    fileFolder.add(settings, 'open').name('Open');
    settings['reset'] = async () => {
      if (skeleton)
        skeleton.removeFromParent();
      avatar.removeFromParent();
      controlGui.close();
      await loadAvatar({ canvas, game, world, callbacks, src: 'models/xbot.glb', fileName: null });
    };
    fileFolder.add(settings, 'reset').name('Reset');

    const exportFolder = fileFolder.addFolder('Export');
    exportFolder.close();
    exportFolder.add(exporterSettings, 'useParent').name('Use Parent');
    exportFolder.add(exporterSettings, 'trs').name('Use TRS');
    exportFolder.add(exporterSettings, 'onlyVisible').name('Only Visible Objects');
    exportFolder.add(exporterSettings, 'binary').name('Binary (GLB)');
    exportFolder.add(exporterSettings, 'maxTextureSize', 2, 8192).name('Max Texture Size').step(1);
    exportFolder.add(exporterSettings, 'includeAnimations').name('Include Animations');
    settings['export'] = async () => {
      const link = document.createElement('a');
      link.style.display = 'none';
      document.body.appendChild( link ); // Firefox workaround, see #6594
      const save = (blob, filename) => {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        // URL.revokeObjectURL( url ); breaks Firefox...
      };
      const saveString = (text, filename) => {
        save(new Blob([ text ], { type: 'text/plain' }), filename);
      };
      const saveArrayBuffer = (buffer, filename) => {
        save(new Blob([ buffer ], { type: 'application/octet-stream' }), filename);
      };

      const exporter = new GLTFExporter();
      let animations = null;
      if (exporterSettings.includeAnimations) {
        const template = avatar?.template;
        animations = template?.animations;
      }
      const options = {
        trs: exporterSettings.trs,
        onlyVisible: exporterSettings.onlyVisible,
        binary: exporterSettings.binary,
        maxTextureSize: exporterSettings.maxTextureSize,
        animations
      };
      exporter.parse(
        exporterSettings.useParent ? avatar.parent : avatar,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            console.log('Exported as binary.', gltf);
            saveArrayBuffer(gltf, 'exported.glb');
          } else {
            const output = JSON.stringify(gltf, null, 2);
            console.log('Exported as text.', output);
            saveString(output, 'exported.gltf');
          }
        },
        (error) => {
          console.error(`An error happened during parsing ${error}.`);
        },
        options
      );
    };
    exportFolder.add(settings, 'export').name('Export');

    return result;
  };
  await loadAvatar({ canvas, game, world, callbacks, src: 'models/xbot.glb', fileName: null });

  // Setup the update routine.
  let updater = null;
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  if (game.isAutoUpdated()) {
    function render() {
      updater?.();

      game.update();

      stats.update();

      requestAnimationFrame(render);
    }

    render();
  } else {
    game.update();
  }

  // Register the event handlers.
  do {
    window.addEventListener('resize', () => {
      game.onResized(window.innerWidth, window.innerHeight);
    }, false);
    document.addEventListener('keydown', (event) => {
      game.onKeyDown(event.keyCode);
    }, false);
    document.addEventListener('keyup', (event) => {
      game.onKeyUp(event.keyCode);

      const callbacks = {
        onActed: (data) => {
          console.log('Acted', data);
        },
        onAnimationStarted: (data) => {
          console.log('Animation started', data);
        },
        onAnimationFinished: (data) => {
          console.log('Animation finished', data);
        }
      };

      switch (event.keyCode) {
        case 83: // S.
          world
            .postMessages( // Stop the current animation.
              "#scene.AvatarRoot.Avatar.controllers.animation",
              {
                "messages": [
                  {
                    "message": "STOP",
                    "clip": "."
                  }
                ]
              },
              callbacks
            );

          break;
        default:
          console.log('Ignore unknown key code', event.keyCode);

          break;
      }
    }, false);
    document.addEventListener('mousedown', (event) => {
      event.preventDefault();
      game.onMouseDown(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
    }, false);
    document.addEventListener('mouseup', (event) => {
      event.preventDefault();
      game.onMouseUp(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
    }, false);
    document.addEventListener('mousemove', (event) => {
      event.preventDefault();
      game.onMouseMove(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
    }, false);
  } while (false);

  // Expose the JJJ framework and the game objects create above.
  window.JJJ = {
    Game,
    canvas,
    game, world,
    loadAvatar,
    setUpdater: (handler) => {
      updater = handler;
    }
  };
} else {
  const warning = WEBGL.getWebGLErrorMessage();
  document.body.appendChild(warning);
}
