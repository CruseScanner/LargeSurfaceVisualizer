import OSG from 'external/osg';
import ScanRenderingCompilerVertex from 'cruse3DViewer/ScanRenderingCompilerVertex';
import utils from 'tools/utils';

'use strict';

var osgShader = OSG.osgShader;
var osgShadow = OSG.osgShadow;
var osg = OSG.osg;


// this compiler use basic lighting and add a node to demonstrate how to
// customize the shader compiler
var ShadowCastScanRenderingCompiler = function() {

    this._displacementTextureName = undefined;
    this._normalTextureName = undefined;
    this._glossTextureName = undefined;

    osgShader.Compiler.apply(this, arguments);
};

// we use same attributes than the default compiler
var config = osgShader.Compiler.cloneStateAttributeConfig(osgShadow.ShadowCastCompiler);
config.attribute.push('TileDomainTransform');
config.textureAttribute.push('DisplacementTexture');

osgShader.Compiler.setStateAttributeConfig(ShadowCastScanRenderingCompiler, config);

ShadowCastScanRenderingCompiler.prototype = osg.objectInherit(osgShadow.ShadowCastCompiler.prototype, 
                                     utils.extend({}, ScanRenderingCompilerVertex, {
  
    getCompilerName: function() {
        return 'ShadowCastScanRenderingCompiler';
    },

    registerTextureAttributes: function(tuTarget, tunit) {
        osgShader.Compiler.prototype.registerTextureAttributes.call(this, tuTarget, tunit);

        var tType = tuTarget.className();
        if (tType.indexOf('DisplacementTexture') !== -1)
            return this.registerDisplacementTexture(tuTarget, tunit);
    },

    registerDisplacementTexture: function(tuTarget, texUnit) {
        var tName = tuTarget.getName();
        if (!tName) {
            tName = 'Texture' + texUnit;
            tuTarget.setName(tName);
        }
        this._displacementTextureName = tName;

        this._texturesByName[tName] = {
            texture: tuTarget,
            variable: undefined,
            textureUnit: texUnit,
            shadow: true // setting shadow to true to avoid using it in diffuse color
        };
    },

}));

export default ShadowCastScanRenderingCompiler;

