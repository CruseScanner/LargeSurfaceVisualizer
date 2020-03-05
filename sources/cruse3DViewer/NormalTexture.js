import OSG from 'external/osg';

'use strict';

var osgShader = OSG.osgShader;
var osg = OSG.osg;

  
var NormalTexture = function() {
    osg.Texture.call(this);
};

osg.createPrototypeStateAttribute(
    NormalTexture,
    osg.objectInherit(osg.Texture.prototype, {
        attributeType: 'NormalTexture',

        cloneType: function() {
            return new NormalTexture();
        },
    }),
    'osg',
    'NormalTexture'
);

export default NormalTexture;