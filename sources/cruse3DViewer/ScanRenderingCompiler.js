import OSG from 'external/osg';
import ScanRenderingCompilerVertex from 'cruse3DViewer/ScanRenderingCompilerVertex';
import ScanRenderingCompilerFrag from 'cruse3DViewer/ScanRenderingCompilerFrag';
import utils from 'tools/utils';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;


// this compiler use basic lighting and add a node to demonstrate how to
// customize the shader compiler
var ScanRenderingCompiler = function() {

    this._displacementTextureName = undefined;
    this._normalTextureName = undefined;
    this._glossTextureName = undefined;

    osgShader.Compiler.apply(this, arguments);
};

// we use same attributes than the default compiler
var config = osgShader.Compiler.cloneStateAttributeConfig(osgShader.Compiler);
config.attribute.push('TileDomainTransform');
config.attribute.push('FactoryShading');
config.textureAttribute.push('DisplacementTexture');
config.textureAttribute.push('NormalTexture');
config.textureAttribute.push('GlossTexture');

osgShader.Compiler.setStateAttributeConfig(ScanRenderingCompiler, config);

ScanRenderingCompiler.prototype = osg.objectInherit(osgShader.Compiler.prototype, 
                                     utils.extend({}, ScanRenderingCompilerVertex, ScanRenderingCompilerFrag, {
  
    getCompilerName: function() {
        return 'ScanRenderingCompiler';
    },

    registerTextureAttributes: function(tuTarget, tunit) {
        osgShader.Compiler.prototype.registerTextureAttributes.call(this, tuTarget, tunit);

        var tType = tuTarget.className();
        if (tType.indexOf('DisplacementTexture') !== -1)
            return this.registerDisplacementTexture(tuTarget, tunit);
        if (tType.indexOf('NormalTexture') !== -1)
            return this.registerNormalTexture(tuTarget, tunit);
        if (tType.indexOf('GlossTexture') !== -1)
            return this.registerGlossTexture(tuTarget, tunit);
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

    registerNormalTexture: function(tuTarget, texUnit) {
        var tName = tuTarget.getName();
        if (!tName) {
            tName = 'Texture' + texUnit;
            tuTarget.setName(tName);
        }
        this._normalTextureName = tName;

        this._texturesByName[tName] = {
            texture: tuTarget,
            variable: undefined,
            textureUnit: texUnit,
            shadow: true // setting shadow to true to avoid using it in diffuse color
        };
    },

    registerGlossTexture: function(tuTarget, texUnit) {
        var tName = tuTarget.getName();
        if (!tName) {
            tName = 'Texture' + texUnit;
            tuTarget.setName(tName);
        }
        this._glossTextureName = tName;

        this._texturesByName[tName] = {
            texture: tuTarget,
            variable: undefined,
            textureUnit: texUnit,
            shadow: true // setting shadow to true to avoid using it in diffuse color
        };
    },
}));

export default ScanRenderingCompiler;

