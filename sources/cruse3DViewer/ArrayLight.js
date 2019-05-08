import OSG from 'external/osg';
var osg = OSG.osg;

function ArrayLight(lightNum, disable) {
    osg.Light.call(this, lightNum, disable);
    this.attributeType =  'ArrayLight';

    this.cloneType = function() {
        return new ArrayLight(this._lightNumber, true);
    };

    this.getTypeMember = function() {
        return "ArrayLight" + this._lightNumber;
    };
    
    this.getUniformName = function(name) {
        return 'uLight_' + name + '[' + this.getLightNumber() + ']';
    };
}

ArrayLight.prototype = Object.create(osg.Light.prototype);

export default ArrayLight;