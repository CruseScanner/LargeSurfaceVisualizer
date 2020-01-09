import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;


// FactoryShading Attribute: if added, the Shading / Lighting Computation uses the same lighting model
// as Cruse Factory

var FactoryShadingAttribute = function() {
    osg.StateAttribute.call(this);
    this._offsetAndScale = osg.vec4.fromValues(0,0,1.0, 1.0);
    this._textureOffsetAndScale = osg.vec4.fromValues(0,0,1.0,1.0);
};

osg.createPrototypeStateAttribute(
    FactoryShadingAttribute,
    osg.objectInherit(osg.StateAttribute.prototype, {
        attributeType: 'FactoryShading',

        cloneType: function() {
            return new FactoryShadingAttribute();
        },
    }),
    'osg',
    'FactoryShading'
);

export default FactoryShadingAttribute;