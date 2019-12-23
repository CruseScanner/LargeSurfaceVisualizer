import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;

// this compiler use basic lighting and add a node to demonstrate how to
// customize the shader compiler
var ScanRenderingCompiler = function() {
    osgShader.Compiler.apply(this, arguments);
};

// we use same attributes than the default compiler
var config = osgShader.Compiler.cloneStateAttributeConfig(osgShader.Compiler);
config.attribute.push('TileDomainTransform');
osgShader.Compiler.setStateAttributeConfig(ScanRenderingCompiler, config);

ScanRenderingCompiler.prototype = osg.objectInherit(osgShader.Compiler.prototype, {
  
    getCompilerName: function() {
        return 'ScanRenderingCompiler';
    },

    getOrCreateLocalVertex: function() {
        var localVertex = osgShader.Compiler.prototype.getOrCreateLocalVertex.call(this);

        // ======================================================
        // custom attribute tileDomainTransform
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

