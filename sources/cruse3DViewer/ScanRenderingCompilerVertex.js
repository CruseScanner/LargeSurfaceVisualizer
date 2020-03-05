import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;


var ScanRenderingCompilerVertex = {
  
    getOrCreateUntransformedLocalVertex: function() {
        return osgShader.Compiler.prototype.getOrCreateLocalVertex.call(this);
    },

    getOrCreateLocalVertex: function() {
        var untransformedVertex = this.getOrCreateUntransformedLocalVertex();
        var localVertex = untransformedVertex;

        // ======================================================
        // custom attribute TileDomainTransform
        // ======================================================
        var tileDomainTransformAttribute = this.getAttributeType('TileDomainTransform');

        if (tileDomainTransformAttribute && tileDomainTransformAttribute.getEnabled()) {
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

};

export default ScanRenderingCompilerVertex;

