import OpenSeadragon from 'openseadragon';

var Cruse2DViewer = function(element, imageSource){
  
  var prefix = imageSource.prefix || '?IIIF='
  var fullUrl = imageSource.server + prefix + imageSource.image + '/info.json';  

  if(typeof(element) == 'string')
  {
    element = document.getElementById(element);
  }

  this.viewer = OpenSeadragon({
    element: element,
    tileSources:   [fullUrl],
  });
};

Cruse2DViewer.prototype = {
  getView : function() 
  {
    return this.viewer.viewport.getBounds();
  },

  restoreView : function(view)
  {
    this.viewer.viewport.fitBounds(view);
  }
};

export default Cruse2DViewer;