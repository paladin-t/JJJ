<img src="imgs/logo.png" width="128">

<hr>

[JJJ (3Js)](https://paladin-t.github.io/tiny/jjj/index.html) is a 3D toolkit and framework based on Three.js. It implements a data-driven DSL to setup, manipulate and control resources, objects, materials and behaviours in the game world. It also offers a number of toolkits to help make your final game, for the moment it offers the following tools:

* [3D model viewer](https://paladin-t.github.io/tiny/jjj/viewer.html)

More features, tools and examples are WIP.

<hr>

## Table of Content

- [Table of Content](#table-of-content)
- [Installing](#installing)
- [API](#api)
  - [Creating Game World](#creating-game-world)
  - [Setup and Update](#setup-and-update)
  - [Callbacks](#callbacks)
  - [Constructing Scene Graph](#constructing-scene-graph)
    - [Applying Controller to Objects](#applying-controller-to-objects)
    - [Loading Model to Scene Graph](#loading-model-to-scene-graph)
    - [Animating Model](#animating-model)
  - [Posting Message](#posting-message)
  - [Querying Objects](#querying-objects)
- [License](#license)

<hr>

## Installing

JJJ is Configured with Webpack as a bundler.

Clone the project and install dependencies:

```bash
git clone https://github.com/paladin-t/JJJ.git
npm i
```

Start a webpack development server:

```bash
npm run start
```

Make a build:

```bash
npm run build
```

<hr>

## API

### Creating Game World

```js
const game = new Game({
  mode: 'default',
  canvas
});
```

* Creates a game object
  * `mode: string | class constructor | object`: the game mode, can be one of the following "Game Modes" when it is string typed
  * `canvas: Canvas | null`: the canvas object to create the game on, or `null` to let the framework to create one

| Game Modes | Note |
|---|---|
| 'default' | The type of a generic game |

```js
const world = game.get('#world');
```

* Gets the world object of a game

### Setup and Update

Most of the operations are described in a JSON-based DSL.

```js
await world
  .execute(
    {
      "commands": [
        {
          "command": "setup",
          "renderer": [
            {
              "type": "default",
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
        }
      ]
    }
  );
```

* Setup renderer and camera for the specific game world
  * `renderer[n].type` can be one of the following "Renderer Types"
  * `camera.type` can be either "perspective" or "orthographic", see the following examples

| Renderer Types | Note |
|---|---|
| 'default' | The type of a standard renderer |
| 'bloom' | The type of a bloom renderer |
| 'toon' | The type of a toon renderer |

<details>
<summary>Perspective/Orthographic Camera</summary>

```js
...
"camera": {
  "type": "perspective",
  "aspect": 60,
  "near": 0.1, "far": 100,
  "position": [ 0, 1.8, 3 ],
  "target": [ 0, 1, 0 ]
}
...
```

```js
...
"camera": {
  "type": "orthographic",
  "left": -2, "right": 2,
  "top": 2, "bottom": -2,
  "near": 0.1, "far": 100,
  "position": [ 0, 1.8, 3 ],
  "target": [ 0, 1, 0 ]
}
...
```

</details>

```js
function render() {
  game.update();

  requestAnimationFrame(render);
}
render();
```

### Callbacks

Most of the API will feedback to specific callback entries.

<details>
<summary>Callbacks</summary>

```js
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
  },

  onActed: (data) => {
    console.log('Acted', data);
  },
  onAnimationStarted: (data) => {
    console.log('Animation started', data);
  },
  onAnimationFinished: (data) => {
    console.log('Animation finished', data);
  },

  onReturned: (data) => {
    console.log('Got actions', data);
  }
};
```

</details>

### Constructing Scene Graph

```js
await world
  .execute(
    {
      "commands": [
        {
          "command": "load",
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
        }
      ]
    },
    callbacks
  );
```

#### Applying Controller to Objects

```js
await world
  .execute(
    {
      "commands": [
        {
          "command": "control",
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
```

#### Loading Model to Scene Graph

```js
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
              "src": "example.glb",
              "position": [ 0, 0, 0 ],
              "scale": [ 1, 1, 1 ],
              "rotation": [ 0, 0, 0 ],
              "castShadow": true,
              "material": {
                "depthWrite": true,
                "metalness": 0.1
              }
            }
          ]
        }
      ]
    },
    callbacks
  );
```

#### Animating Model

```js
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
```

### Posting Message

```js
world
  .postMessage(
    "#scene.AvatarRoot.Avatar.controllers.animation",
    {
      "message": "GET_ACTIONS"
    },
    {
      onReturned: (data) => {
        console.log('Got actions', data);
      }
    }
  );
```

### Querying Objects

```js
const scene = world.query('#scene');

const avatar = world.query('#scene.AvatarRoot.Avatar');

const foo = world.query([
  '#scene.some.node',
  {
    byUUID: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  },
  {
    byType: 'Object3D'
  },
  {
    byIndex: 42
  },
  'material'
]);
```

<hr>

## License

JJJ is distributed under the MIT license.
