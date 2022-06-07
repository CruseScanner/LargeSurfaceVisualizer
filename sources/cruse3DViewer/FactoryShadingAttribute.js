import OSG from 'external/osg';

<<<<<<< HEAD
'use strict';
=======
('use strict');
>>>>>>> UpdateToNewerDependencies

var osgShader = OSG.osgShader;
var osg = OSG.osg;

<<<<<<< HEAD

// FactoryShading Attribute: if added, the Shading / Lighting Computation uses the same lighting model
// as Cruse Factory

var FactoryShadingAttribute = function() {
=======
// FactoryShading Attribute: if added, the Shading / Lighting Computation uses the same lighting model
// as Cruse Factory

var FactoryShadingAttribute = function () {
>>>>>>> UpdateToNewerDependencies
    osg.StateAttribute.call(this);
    this._isLODColoringEnabled = false;
};

osg.createPrototypeStateAttribute(
    FactoryShadingAttribute,
    osg.objectInherit(osg.StateAttribute.prototype, {
        attributeType: 'FactoryShading',

<<<<<<< HEAD
        cloneType: function() {
            return new FactoryShadingAttribute();
        },

        isLODColoringEnabled: function()
        { 
            return this._isLODColoringEnabled; 
        },

        setLODColoringEnabled: function(value)
        {
             this._isLODColoringEnabled = value; 
        },

        getHash: function() {
=======
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
>>>>>>> UpdateToNewerDependencies
            return this.getType() + this._isLODColoringEnabled.toString();
        }
    }),
    'osg',
    'FactoryShading'
);

<<<<<<< HEAD
export default FactoryShadingAttribute;
=======
export default FactoryShadingAttribute;
>>>>>>> UpdateToNewerDependencies
