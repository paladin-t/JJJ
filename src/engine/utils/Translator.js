import * as THREE from 'three'

class Translator {
  static MATERIAL_PLAIN_ENTRIES = [
    'alphaHash',
    'alphaTest',
    'alphaToCoverage',
    'aoMapIntensity',
    'attenuationColor',
    'attenuationDistance',
    'blendAlpha',
    'blendColor',
    'blendDst',
    'blendDstAlpha',
    'blendEquation',
    'blendEquationAlpha',
    'blending',
    'blendSrc',
    'blendSrcAlpha',
    'bumpScale',
    'clearcoat',
    'clearcoatRoughness',
    'clipIntersection',
    'clippingPlanes',
    'clipShadows',
    'color',
    'colorWrite',
    'combine',
    'dashSize',
    'depthFunc',
    'depthTest',
    'depthWrite',
    'dithering',
    'displacementScale',
    'displacementBias',
    'emissive',
    'emissiveIntensity',
    'envMapIntensity',
    'flatShading',
    'fog',
    'forceSinglePass',
    'gapSize',
    'ior',
    'iridescence',
    'iridescenceIOR',
    'iridescenceThicknessRange',
    'lightMapIntensity',
    'linecap',
    'linejoin',
    'linewidth',
    'metalness',
    'needsUpdate',
    'normalMapType',
    'opacity',
    'polygonOffset',
    'polygonOffsetFactor',
    'polygonOffsetUnits',
    'precision',
    'premultipliedAlpha',
    'refractionRatio',
    'reflectivity',
    'roughness',
    'scale',
    'shadowSide',
    'sheen',
    'sheenColor',
    'sheenRoughness',
    'shininess',
    'side',
    'specular',
    'specularColor',
    'specularIntensity',
    'stencilWrite',
    'stencilWriteMask',
    'stencilFunc',
    'stencilRef',
    'stencilFuncMask',
    'stencilFail',
    'stencilZFail',
    'stencilZPass',
    'thickness',
    'toneMapped',
    'transmission',
    'transparent',
    'visible',
    'wireframe',
    'wireframeLinecap',
    'wireframeLinejoin',
    'wireframeLinewidth'
  ];
  static MATERIAL_VECTOR2_ENTRIES = [
    'clearcoatNormalScale',
    'normalScale'
  ];
  static MATERIAL_TEXTURE_ENTRIES = [
    'texture',
    'alphaMap',
    'aoMap',
    'bumpMap',
    'clearcoatMap',
    'clearcoatNormalMap',
    'clearcoatRoughnessMap',
    'displacementMap',
    'emissiveMap',
    'envMap',
    'gradientMap',
    'iridescenceMap',
    'iridescenceThicknessMap',
    'lightMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
    'sheenColorMap',
    'sheenRoughnessMap',
    'specularColorMap',
    'specularIntensityMap',
    'specularMap',
    'thicknessMap',
    'transmissionMap'
  ];

  static getNumber3(data, key) {
    let num3 = data[key];

    if (typeof num3 == 'number') num3 = [ num3, num3, num3 ];
    else                         num3 =   num3 || [ 0, 0, 0 ];

    const ret = { };
    ret[key] = num3;

    return ret;
  }

  static getTransform(data) {
    let { position, scale, rotation } = data;

    if (typeof position == 'number') position = [ position, position, position ];
    else                             position =   position || [ 0, 0, 0 ];
    if (typeof scale == 'number')    scale    = [ scale, scale, scale ];
    else                             scale    =   scale    || [ 1, 1, 1 ];
    if (typeof rotation == 'number') rotation = [ rotation, rotation, rotation ];
    else                             rotation =   rotation || [ 0, 0, 0 ];

    return { position, scale, rotation };
  }

  static getMaterialData(data, key, textureLoader) {
    if (!(key in data))
      return undefined;

    if (Translator.MATERIAL_PLAIN_ENTRIES.indexOf(key) >= 0) {
      const val = data[key];

      return val;
    } else if (Translator.MATERIAL_VECTOR2_ENTRIES.indexOf(key) >= 0) {
      const val = data[key];

      return THREE.Vector2(val[0], val[1]);
    } else if (Translator.MATERIAL_TEXTURE_ENTRIES.indexOf(key) >= 0) {
      let texData = null;
      let src = null;
      if (typeof data[key] == 'string') {
        src = data[key];
      } else {
        texData = data[key];
        src = texData.src;
      }
      let val = null;
      if (src) {
        val = textureLoader.load(src);
        val.colorSpace = THREE.SRGBColorSpace;
        val.wrapS = THREE.RepeatWrapping;
        val.wrapT = THREE.RepeatWrapping;
        Translator.applyTextureData(val, texData, 'colorSpace');
        Translator.applyTextureData(val, texData, 'wrapS');
        Translator.applyTextureData(val, texData, 'wrapT');
        Translator.applyTextureData(val, texData, 'minFilter');
        Translator.applyTextureData(val, texData, 'magFilter');
      }

      return val;
    } else {
      throw `Unknown material entry "${key}".`
    }
  }

  static applyTextureData(texture, data, key) {
    if (!data)
      return;
    if (!(key in data))
      return;

    if (typeof data[key] == 'undefined')
      return;

    texture[key] = data[key];
  }
}

export { Translator }
