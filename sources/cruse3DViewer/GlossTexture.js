import OSG from 'external/osg';

('use strict');

var osgShader = OSG.osgShader;
var osg = OSG.osg;

var GlossTexture = function () {
    osg.Texture.call(this);
};

osg.createPrototypeStateAttribute(
    GlossTexture,
    osg.objectInherit(osg.Texture.prototype, {
        attributeType: 'GlossTexture',

        cloneType: function () {
            return new GlossTexture();
        }
    }),
    'osg',
    'GlossTexture'
);

export default GlossTexture;
