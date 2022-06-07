import OSG from 'external/osg';

<<<<<<< HEAD
'use strict';
=======
('use strict');
>>>>>>> UpdateToNewerDependencies

var osgShader = OSG.osgShader;
var osg = OSG.osg;

<<<<<<< HEAD
  
var GlossTexture = function() {
=======
var GlossTexture = function () {
>>>>>>> UpdateToNewerDependencies
    osg.Texture.call(this);
};

osg.createPrototypeStateAttribute(
    GlossTexture,
    osg.objectInherit(osg.Texture.prototype, {
        attributeType: 'GlossTexture',

<<<<<<< HEAD
        cloneType: function() {
            return new GlossTexture();
        },
=======
        cloneType: function () {
            return new GlossTexture();
        }
>>>>>>> UpdateToNewerDependencies
    }),
    'osg',
    'GlossTexture'
);

<<<<<<< HEAD
export default GlossTexture;
=======
export default GlossTexture;
>>>>>>> UpdateToNewerDependencies
