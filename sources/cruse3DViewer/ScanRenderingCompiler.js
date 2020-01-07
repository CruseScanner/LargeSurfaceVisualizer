import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;

// this compiler use basic lighting and add a node to demonstrate how to
// customize the shader compiler
var ScanRenderingCompiler = function() {

    this._displacementTextureName = undefined;
    osgShader.Compiler.apply(this, arguments);
};

// we use same attributes than the default compiler
var config = osgShader.Compiler.cloneStateAttributeConfig(osgShader.Compiler);
config.attribute.push('TileDomainTransform');
config.textureAttribute.push('DisplacementTexture');
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
                    displacementMap: this.getOrCreateSampler('sampler2D', 'Texture' + texUnit),
                })
                .outputs({
                    vertexOutput: displacementResult,
                });

            localVertex = displacementResult;
        }

        return localVertex;
    },

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

