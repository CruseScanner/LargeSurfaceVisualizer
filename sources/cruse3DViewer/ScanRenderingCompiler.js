import OSG from 'external/osg';

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
config.textureAttribute.push('DisplacementTexture');
config.textureAttribute.push('NormalTexture');
config.textureAttribute.push('GlossTexture');

osgShader.Compiler.setStateAttributeConfig(ScanRenderingCompiler, config);

ScanRenderingCompiler.prototype = osg.objectInherit(osgShader.Compiler.prototype, {
  
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


    getOrCreateLocalVertex: function() {
        var untransformedVertex = osgShader.Compiler.prototype.getOrCreateLocalVertex.call(this);
        var localVertex = untransformedVertex;

        // ======================================================
        // custom attribute TileDomainTransform
        // ======================================================
        var tileDomainTransformAttribute = this.getAttributeType('TileDomainTransform');

        if (tileDomainTransformAttribute) {
            var tileDomainTransformResult = this.createVariable('vec3');        
            var uOffsetScale = tileDomainTransformAttribute.getOrCreateUniforms().offsetAndScale;
           
            
            this.getNode('TileDomainTransform')
                .inputs({
                    Vertex: localVertex,
                    offsetScale: this.getOrCreateUniform(uOffsetScale)                            
                })
                .outputs({
                    vertexOutput: tileDomainTransformResult,
                });

            localVertex = tileDomainTransformResult;
        }

        // ======================================================
        // custom Texture Type DisplacementTexture
        // ======================================================
        
        if (this._displacementTextureName) {

            var displacementTextureObj = this._texturesByName[this._displacementTextureName];
            var displacementTextureAttribute = displacementTextureObj.texture;

            var displacementResult = this.createVariable('vec3');        
            var uTextureOffsetScale = displacementTextureAttribute.getOrCreateUniforms().textureOffsetAndScale;
            var uDisplacementRange = displacementTextureAttribute.getOrCreateUniforms().displacementRange;
            var texUnit = displacementTextureObj.textureUnit;
            
            this.getNode('DisplaceVertex')
                .inputs({
                    originalVertex: untransformedVertex,
                    tileTransformedVertex: localVertex,
                    displacementOffsetScale: this.getOrCreateUniform(uTextureOffsetScale),
                    displacementRange: this.getOrCreateUniform(uDisplacementRange),
                    displacementMap: this.getOrCreateSampler('sampler2D', 'DisplacementTexture' + texUnit),
                })
                .outputs({
                    vertexOutput: displacementResult,
                });

            localVertex = displacementResult;
        }

        return localVertex;
    },

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
    // Overides to Use XY Coords as Texture coords
    //
    
    declareVertexVaryings: function(roots){
        osgShader.Compiler.prototype.declareVertexVaryings.call(this, roots);

        for (var keyVarying in roots) {
            var varying = roots[keyVarying];
           
            var name = varying.getVariable();
            if (name.indexOf('vTexCoord0') !== -1) {
                this.transfromVertexTexcoord(varying);
            }     
        }
    },

    transfromVertexTexcoord: function(varyingTexCoord0){

        var tileDomainTransformAttribute = this.getAttributeType('TileDomainTransform');

        if (tileDomainTransformAttribute) {
                        
            var localVertex = osgShader.Compiler.prototype.getOrCreateLocalVertex.call(this);
            var texCoordTransformResult = this.createVariable('vec2');   
            var uTextureOffsetScale = tileDomainTransformAttribute.getOrCreateUniforms().textureOffsetAndScale;

            this.getNode('TexcoordFromTileDomain')
            .inputs({
                Vertex: localVertex,
                textureOffsetScale: this.getOrCreateUniform(uTextureOffsetScale)                    
            })
            .outputs({
                texcoordOutput: texCoordTransformResult
            });

            this.getNode('SetFromNode')
                .inputs(texCoordTransformResult)
                .outputs(varyingTexCoord0);
        
        }
    },

});

export default ScanRenderingCompiler;

