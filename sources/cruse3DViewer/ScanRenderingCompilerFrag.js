import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;


// this compiler use basic lighting and add a node to demonstrate how to
// customize the shader compiler
var ScanRenderingCompilerFrag = {
    
    //
    // Overides to Handle NormalTexture
    //

    getOrCreateMaterialNormal: function() 
    {
        if (this._normalTextureName && this._fragmentShaderMode) {
            return this.getOrCreateNormalizedFrontViewNormalFromNormalMap();
        }

        return osgShader.Compiler.prototype.getOrCreateMaterialNormal.call(this);
    },

    getOrCreateNormalizedFrontViewNormalFromNormalMap: function() {
        var out = this._variables.nFrontViewNormalFromNormalMap;
        if (out) return out;
        out = this.createVariable('vec3', 'nFrontViewNormalFromNormalMap');

        this.getNode('Normalize')
            .inputs({ vec: this.getOrCreateFrontViewNormalFromNormalMap() })
            .outputs({ result: out });

        return out;
    },

    getOrCreateFrontViewNormalFromNormalMap: function() {
        var out = this._variables.frontViewNormalFromNormalMap;
        if (out) return out;
        out = this.createVariable('vec3', 'frontViewNormalFromNormalMap');

        this.getNode('FrontNormal')
            .inputs({ normal: this.getOrCreateViewNormalFromNormalMap() })
            .outputs({ result: out });

        return out;
    },

    getOrCreateViewNormalFromNormalMap: function() {
       
        var out = this._variables.viewNormalFromNormalMap;
        if (out) return out;
        out = this.createVariable('vec3', 'viewNormalFromNormalMap');

        this.getNode('MatrixMultDirection')
            .inputs({
                matrix: this.getOrCreateUniform('mat3', 'uModelViewNormalMatrix'),
                vec: this.getOrCreateLocalNormalFromNormalMap()
            })
            .outputs({ vec: out });

        return out;
    },

    getOrCreateLocalNormalFromNormalMap: function() {

            var normalTextureObj = this._texturesByName[this._normalTextureName];
            var texUnit = normalTextureObj.textureUnit;
            var texCoordUnit = 0; // reuse texcoords for diffuse texture (HACK)
            var normalMapResult = this.createVariable('vec3');     

            var texCoord = this.getOrCreateVarying('vec2', 'vTexCoord' + texCoordUnit);
            
            this.getNode('NormalFromTexture')
            .inputs({
                normalTexture: this.getOrCreateSampler('sampler2D', 'NormalTexture' + texUnit),
                texcoord: texCoord
            })
            .outputs({
                normalOutput: normalMapResult,
            });

            return normalMapResult;
    },

    //
    // Overides to provide correct model normal with displacement mapping to fragment shader
    //
    getOrCreateModelNormal: function() {
        if (this._fragmentShaderMode && this._displacementTextureName) {

            var result = this.createVariable('vec3', 'perFaceModelNormal');     
            var position = this.getOrCreateModelVertex();
            
            this.getNode('NormalFromPosition')
            .inputs({
                pos: position,
            })
            .outputs({
                normalOutput: result,
            });

            return result;
        }

        return osgShader.Compiler.prototype.getOrCreateModelNormal.call(this);;
    },


    //
    // Overides to Handle GlossTexture
    //
    
    getLighting: function() {

        if (!this._glossTextureName || !this._fragmentShaderMode) {
            return osgShader.Compiler.prototype.getLighting.call(this);            
        }

        if (this._lights.length === 0) return undefined;

        var res = this.getLightingSeparate();

        var glossTextureObj = this._texturesByName[this._glossTextureName];
        var texUnit = glossTextureObj.textureUnit;
        var texCoordUnit = 0; // reuse texcoords for diffuse texture (HACK)
        var samplerName = 'GlossTexture' + texUnit;
        
        var glossOutput = this.createVariable('float');

        this.getNode('GlossFromTexture')
        .inputs({
            glossTexture: this.getOrCreateSampler('sampler2D', samplerName),
            texcoord: this.getOrCreateVarying('vec2', 'vTexCoord' + texCoordUnit),
        })
        .outputs({
            glossOutput: glossOutput,
        });

        var specular = this.createVariable('vec3');
        this.getNode('Mult')
            .inputs(res.specular, glossOutput)
            .outputs(specular);

        var output = this.createVariable('vec3');
        this.getNode('Add')
            .inputs(res.diffuse, specular)
            .outputs(output);

        return output;
    },


    //
    // overrides shadow casting to avoid shadow akne and undersampling artifacts 
    // that appear with light directions close to the z axis: since we dont expect 
    // a lot of shadows in this situations anyway, we blend out shadows for light directions
    // close to the z axis: clamp(shadow + shadowViewLook.z,0.0, 1.0);
    //
    createShadowingLight: function(light, lighted) {
        var lightNum = light.getLightNumber();
        var shadowTexture = this._getShadowTextureFromLightNum(this._shadowsTextures, lightNum);
        var shadowReceive = this._getShadowReceiveAttributeFromLightNum(this._shadows, lightNum);
        if (!shadowTexture || !shadowReceive) return undefined;

        var inputs = this.getInputsFromShadow(shadowReceive, shadowTexture, lighted, lightNum);

        var shadowedOutput = osgShader.Compiler.prototype.createShadowingLight.call(this, light, lighted);

        var shadowViewLook = inputs.shadowViewLook;

        var blendedShadow = this.createVariable('float');

        this.getNode('InlineCode')
            .code('%blendedShadow = clamp(%shadow + %lightdir.z,0.0, 1.0);')
            .inputs({
                shadow: shadowedOutput,
                lightdir: shadowViewLook,
            })
            .outputs({
                blendedShadow: blendedShadow
            });

        return blendedShadow;
    },

    //
    // Overides to Handle FactoryShadingAttribute
    //

    getLightWithPrecompute: function(light, precompute) {

        var factoryShadingAttribute = this.getAttributeType('FactoryShading');

        if (!factoryShadingAttribute || !this._fragmentShaderMode) {
            return osgShader.Compiler.prototype.getLightWithPrecompute.call(this, light, precompute);            
        }

        var lightUniforms = light.getOrCreateUniforms();

        var inputs = {
            normal: this.getOrCreateMaterialNormal(),
            eyeVector: this.getOrCreateNormalizedViewEyeDirection(),
            dotNL: precompute.dotNL,
            attenuation: precompute.attenuation,

            materialDiffuse: this.getOrCreateMaterialDiffuseColor(),
            materialSpecular: this.getOrCreateMaterialSpecularColor(),
            materialShininess: this.getOrCreateMaterialSpecularHardness(),

            lightDiffuse: this.getOrCreateUniform(lightUniforms.diffuse),
            lightSpecular: this.getOrCreateUniform(lightUniforms.specular),
            eyeLightDir: precompute.eyeLightDir
        };

        var outputs = this.getOutputsFromLight();
        this.getNode('FactoryShading')
            .inputs(inputs)
            .outputs(outputs);

        return outputs;
    },

    getPremultAlpha: function(finalColor, alpha) {

        var outColor = finalColor;

        var factoryShadingAttribute = this.getAttributeType('FactoryShading');
        var tileDomainTransformAttribute = this.getAttributeType('TileDomainTransform');

        if (this._fragmentShaderMode &&
            tileDomainTransformAttribute &&
            factoryShadingAttribute && 
            factoryShadingAttribute.isLODColoringEnabled()
            ) 
        {
            var outputLODColored = this.createVariable('vec4');
            var uLodLevel = tileDomainTransformAttribute.getOrCreateUniforms().lodLevel;
           
            this.getNode('ColorByLODLevel')
                .inputs({
                    inputColor: finalColor,
                    lodLevel: this.getOrCreateUniform(uLodLevel),                           
                })
                .outputs({
                    colorOutput: outputLODColored,
                });
            outColor = outputLODColored;
        }
       
        return osgShader.Compiler.prototype.getPremultAlpha.call(this, outColor, alpha);  
    },
};

export default ScanRenderingCompilerFrag;

