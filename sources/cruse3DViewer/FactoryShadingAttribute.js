import OSG from 'external/osg';

('use strict');

var osgShader = OSG.osgShader;
var osg = OSG.osg;

// FactoryShading Attribute: if added, the Shading / Lighting Computation uses the same lighting model
// as Cruse Factory

var FactoryShadingAttribute = function () {
    osg.StateAttribute.call(this);
    this._isLODColoringEnabled = false;
};

osg.createPrototypeStateAttribute(
    FactoryShadingAttribute,
    osg.objectInherit(osg.StateAttribute.prototype, {
        attributeType: 'FactoryShading',

        cloneType: function () {
            return new FactoryShadingAttribute();
        },

        isLODColoringEnabled: function () {
            return this._isLODColoringEnabled;
        },

        setLODColoringEnabled: function (value) {
            this._isLODColoringEnabled = value;
        },

        getHash: function () {
            return this.getType() + this._isLODColoringEnabled.toString();
        }
    }),
    'osg',
    'FactoryShading'
);

export default FactoryShadingAttribute;
