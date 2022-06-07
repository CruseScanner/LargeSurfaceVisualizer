import OSG from 'external/osg';

<<<<<<< HEAD
'use strict';
=======
('use strict');
>>>>>>> UpdateToNewerDependencies

var osgShader = OSG.osgShader;
var osg = OSG.osg;

<<<<<<< HEAD
  
var TileDomainTransformAttribute = function() {
    osg.StateAttribute.call(this);
    this._offsetAndScale = osg.vec4.fromValues(0,0,1.0, 1.0);
    this._textureOffsetAndScale = osg.vec4.fromValues(0,0,1.0,1.0);
=======
var TileDomainTransformAttribute = function () {
    osg.StateAttribute.call(this);
    this._offsetAndScale = osg.vec4.fromValues(0, 0, 1.0, 1.0);
    this._textureOffsetAndScale = osg.vec4.fromValues(0, 0, 1.0, 1.0);
>>>>>>> UpdateToNewerDependencies
    this._lodLevel = 0;
    this._enabled = true;
};

osg.createPrototypeStateAttribute(
    TileDomainTransformAttribute,
    osg.objectInherit(osg.StateAttribute.prototype, {
        attributeType: 'TileDomainTransform',

<<<<<<< HEAD
        cloneType: function() {
=======
        cloneType: function () {
>>>>>>> UpdateToNewerDependencies
            return new TileDomainTransformAttribute();
        },

        // uniforms list are per ClassType
<<<<<<< HEAD
        getOrCreateUniforms: function() {
=======
        getOrCreateUniforms: function () {
>>>>>>> UpdateToNewerDependencies
            var obj = TileDomainTransformAttribute;
            if (obj.uniforms) return obj.uniforms;

            obj.uniforms = {
<<<<<<< HEAD
                offsetAndScale: osg.Uniform.createFloat4(osg.vec4.fromValues(0,0,1.0, 1.0), 'uOffsetScale'),
                textureOffsetAndScale: osg.Uniform.createFloat4(osg.vec4.fromValues(0,0,1.0,1.0), 'uTextureOffsetScale'),
                lodLevel: osg.Uniform.createInt(0, 'uLODLevel'),
=======
                offsetAndScale: osg.Uniform.createFloat4(
                    osg.vec4.fromValues(0, 0, 1.0, 1.0),
                    'uOffsetScale'
                ),
                textureOffsetAndScale: osg.Uniform.createFloat4(
                    osg.vec4.fromValues(0, 0, 1.0, 1.0),
                    'uTextureOffsetScale'
                ),
                lodLevel: osg.Uniform.createInt(0, 'uLODLevel')
>>>>>>> UpdateToNewerDependencies
            };

            return obj.uniforms;
        },

<<<<<<< HEAD
        getHash: function() {
            return this.getType() + this._enabled.toString();
        },

        setOffsetAndScale: function(offsetAndScale) {
            this._offsetAndScale = offsetAndScale;
        },

        getOffsetAndScale: function() {
            return this._offsetAndScale;
        },

        setEnabled: function(value) {
            this._enabled = value;
        },

        getEnabled: function() {
            return this._enabled;
        },

        setTextureOffsetAndScale: function(textureOffsetAndScale) {
            this._textureOffsetAndScale = textureOffsetAndScale;
        },

        getTextureOffsetAndScale: function() {
            return this._textureOffsetAndScale;
        },

        setLODLevel: function(lodlevel) {
            this._lodLevel = lodlevel;
        },

        apply: function() {
            var uniforms = this.getOrCreateUniforms();            
=======
        getHash: function () {
            return this.getType() + this._enabled.toString();
        },

        setOffsetAndScale: function (offsetAndScale) {
            this._offsetAndScale = offsetAndScale;
        },

        getOffsetAndScale: function () {
            return this._offsetAndScale;
        },

        setEnabled: function (value) {
            this._enabled = value;
        },

        getEnabled: function () {
            return this._enabled;
        },

        setTextureOffsetAndScale: function (textureOffsetAndScale) {
            this._textureOffsetAndScale = textureOffsetAndScale;
        },

        getTextureOffsetAndScale: function () {
            return this._textureOffsetAndScale;
        },

        setLODLevel: function (lodlevel) {
            this._lodLevel = lodlevel;
        },

        apply: function () {
            var uniforms = this.getOrCreateUniforms();
>>>>>>> UpdateToNewerDependencies
            uniforms.offsetAndScale.setFloat4(this._offsetAndScale);
            uniforms.textureOffsetAndScale.setFloat4(this._textureOffsetAndScale);
            uniforms.lodLevel.setInt(this._lodLevel);
        }
    }),
    'osg',
    'TileDomainTransform'
);

<<<<<<< HEAD
export default TileDomainTransformAttribute;
=======
export default TileDomainTransformAttribute;
>>>>>>> UpdateToNewerDependencies
