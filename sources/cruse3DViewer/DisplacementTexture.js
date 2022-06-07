import OSG from 'external/osg';

<<<<<<< HEAD
'use strict';
=======
('use strict');
>>>>>>> UpdateToNewerDependencies

var osgShader = OSG.osgShader;
var osg = OSG.osg;

<<<<<<< HEAD
  
var DisplacementTexture = function() {
    osg.Texture.call(this);
    this._textureOffsetAndScale = osg.vec4.fromValues(0,0,1.0,1.0);
=======
var DisplacementTexture = function () {
    osg.Texture.call(this);
    this._textureOffsetAndScale = osg.vec4.fromValues(0, 0, 1.0, 1.0);
>>>>>>> UpdateToNewerDependencies
    this._displacementRange = 1.0;
};

osg.createPrototypeStateAttribute(
    DisplacementTexture,
    osg.objectInherit(osg.Texture.prototype, {
        attributeType: 'DisplacementTexture',

<<<<<<< HEAD
        cloneType: function() {
=======
        cloneType: function () {
>>>>>>> UpdateToNewerDependencies
            return new DisplacementTexture();
        },

        // uniforms list are per ClassType
<<<<<<< HEAD
        getOrCreateUniforms: function(unit) {
            var obj = DisplacementTexture;
            if (obj.uniforms) return obj.uniforms;


            obj.uniforms = osg.Texture.prototype.getOrCreateUniforms.call(this, unit);
            obj.uniforms.textureOffsetAndScale = osg.Uniform.createFloat4(osg.vec4.fromValues(0,0,1.0,1.0), 'uDisplacementOffsetScale');
            obj.uniforms.displacementRange = osg.Uniform.createFloat(1.0, 'uDisplacementRange');
            
            return obj.uniforms;
        },

        setTextureOffsetAndScale: function(textureOffsetAndScale) {
            this._textureOffsetAndScale = textureOffsetAndScale;
        },

        getTextureOffsetAndScale: function() {
            return this._textureOffsetAndScale;
        },

        setDisplacementRange: function(d) {
            this._displacementRange = d;
        },

        getDisplacementRange: function() {
            return this._displacementRange;
        },

        apply: function(state, unit) {
            osg.Texture.prototype.apply.call(this, state, unit);
            
            var uniforms = this.getOrCreateUniforms(unit);                        
=======
        getOrCreateUniforms: function (unit) {
            var obj = DisplacementTexture;
            if (obj.uniforms) return obj.uniforms;

            obj.uniforms = osg.Texture.prototype.getOrCreateUniforms.call(this, unit);
            obj.uniforms.textureOffsetAndScale = osg.Uniform.createFloat4(
                osg.vec4.fromValues(0, 0, 1.0, 1.0),
                'uDisplacementOffsetScale'
            );
            obj.uniforms.displacementRange = osg.Uniform.createFloat(1.0, 'uDisplacementRange');

            return obj.uniforms;
        },

        setTextureOffsetAndScale: function (textureOffsetAndScale) {
            this._textureOffsetAndScale = textureOffsetAndScale;
        },

        getTextureOffsetAndScale: function () {
            return this._textureOffsetAndScale;
        },

        setDisplacementRange: function (d) {
            this._displacementRange = d;
        },

        getDisplacementRange: function () {
            return this._displacementRange;
        },

        apply: function (state, unit) {
            osg.Texture.prototype.apply.call(this, state, unit);

            var uniforms = this.getOrCreateUniforms(unit);
>>>>>>> UpdateToNewerDependencies
            uniforms.textureOffsetAndScale.setFloat4(this._textureOffsetAndScale);
            uniforms.displacementRange.setFloat(this._displacementRange);
        }
    }),
    'osg',
    'DisplacementTexture'
);

<<<<<<< HEAD
export default DisplacementTexture;
=======
export default DisplacementTexture;
>>>>>>> UpdateToNewerDependencies
