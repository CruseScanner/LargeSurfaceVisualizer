import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;

// this compiler use basic lighting and add a node to demonstrate how to
// customize the shader compiler
var CustomCompiler = function() {
    osgShader.Compiler.apply(this, arguments);
};

// we use same attributes than the default compiler
var config = osgShader.Compiler.cloneStateAttributeConfig(osgShader.Compiler);
config.attribute.push('Displacement');
osgShader.Compiler.setStateAttributeConfig(CustomCompiler, config);

CustomCompiler.prototype = osg.objectInherit(osgShader.Compiler.prototype, {
  
    getCompilerName: function() {
        return 'DisplacementCompiler';
    },

    getOrCreateLocalVertex: function() {
        var localVertex = osgShader.Compiler.prototype.getOrCreateLocalVertex(this);

        // ======================================================
        // custom attribute tileDomainTransform
        // ======================================================
        var tileDomainTransformAttribute = this.getAttributeType('TileDomainTransform');

        if (tileDomainTransformAttribute && tileDomainTransformAttribute.getAttributeEnable()) {
            var tileDomainTransformResult = this.createVariable('vec3');

            var uOffsetScale = tileDomainTransformAttribute.getOrCreateUniforms().offsetScale;
            
            this.getNode('DisplaceVertex')
                .inputs({
                    Vertex: localVertex,
                    offsetScale: this.getOrCreateUniform(uOffsetScale),
                })
                .outputs({
                    vertexOutput: tileDomainTransformResult
                });

            localVertex = tileDomainTransformResult;
        }

        return localVertex;
    },

});

export default CustomCompiler;

