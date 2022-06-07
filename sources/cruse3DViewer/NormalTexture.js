import OSG from 'external/osg';

<<<<<<< HEAD
'use strict';
=======
('use strict');
>>>>>>> UpdateToNewerDependencies

var osgShader = OSG.osgShader;
var osg = OSG.osg;

<<<<<<< HEAD
  
var NormalTexture = function() {
=======
var NormalTexture = function () {
>>>>>>> UpdateToNewerDependencies
    osg.Texture.call(this);
};

osg.createPrototypeStateAttribute(
    NormalTexture,
    osg.objectInherit(osg.Texture.prototype, {
        attributeType: 'NormalTexture',

<<<<<<< HEAD
        cloneType: function() {
            return new NormalTexture();
        },
=======
        cloneType: function () {
            return new NormalTexture();
        }
>>>>>>> UpdateToNewerDependencies
    }),
    'osg',
    'NormalTexture'
);

<<<<<<< HEAD
export default NormalTexture;
=======
export default NormalTexture;
>>>>>>> UpdateToNewerDependencies
