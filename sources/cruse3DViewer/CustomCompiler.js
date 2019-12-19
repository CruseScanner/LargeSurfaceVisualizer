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
        var localVertex = osgShader.Compiler.prototype.getLighting.getOrCreateLocalVertex(this);

        // ======================================================
        // custom attribute displacement
        // it's here I connect ouput of light result with my ramp
        // ======================================================
        var displacementAttribute = this.getAttributeType('Displacement');

        if (displacementAttribute && displacementAttribute.getAttributeEnable()) {
            var displacementResult = this.createVariable('vec3');

            var uEnableDisplacement = displacementAttribute.getOrCreateUniforms().enableDisplacement;
            var uDiffuseMapOffsetScale = displacementAttribute.getOrCreateUniforms().diffuseMapOffsetScale;
            var uDisplacementOffsetScale = displacementAttribute.getOrCreateUniforms().displacementOffsetScale;
            var uOffsetScale = displacementAttribute.getOrCreateUniforms().offsetScale;
            var uDisplacementRange = displacementAttribute.getOrCreateUniforms().displacementRange;
            var tUnit = 
            
            this.getNode('DisplaceVertex')
                .inputs({
                    enableDisplacement: this.getOrCreateUniform(uEnableDisplacement),
                    Vertex: this.getOrCreateAttribute('vec2', 'Vertex'),
                    offsetScale: this.getOrCreateUniform(uOffsetScale),
                    diffuseMapOffsetScale: this.getOrCreateUniform(uDiffuseMapOffsetScale),
                    displacementOffsetScale: this.getOrCreateUniform(uDisplacementOffsetScale),
                    displacementRange: this.getOrCreateUniform(uDisplacementRange),
                    displacementMap: this.getOrCreateSampler('sampler2D', 'Texture' + tUnit),            
                })
                .outputs({
                    vertexOutput: displacementResult
                });

            localVertex = displacementResult;
        }

        return localVertex;
    },

});

export default CustomCompiler;

