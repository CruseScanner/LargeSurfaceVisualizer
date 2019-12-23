import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;

  
var TileDomainTransformAttribute = function() {
    osg.StateAttribute.call(this);
    this._offsetAndScale = osg.vec4.fromValues(0,0,1.0, 1.0);
    this._textureOffsetAndScale = osg.vec4.fromValues(0,0,1.0,1.0);
};

osg.createPrototypeStateAttribute(
    TileDomainTransformAttribute,
    osg.objectInherit(osg.StateAttribute.prototype, {
        attributeType: 'TileDomainTransform',

        cloneType: function() {
            return new TileDomainTransformAttribute();
        },

        // uniforms list are per ClassType
        getOrCreateUniforms: function() {
            var obj = TileDomainTransformAttribute;
            if (obj.uniforms) return obj.uniforms;

            obj.uniforms = {
                offsetAndScale: osg.Uniform.createFloat4(osg.vec4.fromValues(0,0,1.0, 1.0), 'uOffsetScale'),
                textureOffsetAndScale: osg.Uniform.createFloat4(osg.vec4.fromValues(0,0,1.0,1.0), 'uTextureOffsetScale')
            };

            return obj.uniforms;
        },

        setOffsetAndScale: function(offsetAndScale) {
            this._offsetAndScale = offsetAndScale;
        },

        getOffsetAndScale: function() {
            return this._offsetAndScale;
        },

        setTextureOffsetAndScale: function(textureOffsetAndScale) {
            this._textureOffsetAndScale = textureOffsetAndScale;
        },

        getTextureOffsetAndScale: function() {
            return this._textureOffsetAndScale;
        },

        apply: function() {
            var uniforms = this.getOrCreateUniforms();            
            uniforms.offsetAndScale.setFloat4(this._offsetAndScale);
            uniforms.textureOffsetAndScale.setFloat4(this._textureOffsetAndScale);
        }
    }),
    'osg',
    'TileDomainTransform'
);

export default TileDomainTransformAttribute;