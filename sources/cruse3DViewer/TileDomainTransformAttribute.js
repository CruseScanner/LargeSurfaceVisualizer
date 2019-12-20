import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;

  
var TileDomainTransformAttribute = function() {
    osg.StateAttribute.call(this);
    this._offsetAndScale = false;
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
                offsetAndScale: osg.Uniform.createFloat4(0, 'uOffsetScale')
            };

            return obj.uniforms;
        },

        setOffsetAndScale: function(offsetAndScale) {
            this._offsetAndScale = offsetAndScale;
        },

        getOffsetAndScale: function() {
            return this._offsetAndScale;
        },

        apply: function() {
            var uniforms = this.getOrCreateUniforms();
            var value = this._offsetAndScale;
            uniforms.offsetAndScale.setFloat4(value);
        }
    }),
    'osg',
    'TileDomainTransform'
);

export default TileDomainTransformAttribute;