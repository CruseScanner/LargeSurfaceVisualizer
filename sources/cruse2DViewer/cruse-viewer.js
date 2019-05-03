import OpenSeadragon from 'openseadragon';
import 'external/openseadragon-scalebar';

var Cruse2DViewer = function(element, imageSource){
  
  var prefix = imageSource.prefix || '?IIIF='
  var fullUrl = imageSource.server + prefix + imageSource.image + '/info.json';  

  if(typeof(element) == 'string')
  {
    element = document.getElementById(element);
  }

  var toolbarElement = document.createElement('div');
  toolbarElement.className = 'cruse-scanviewer-toolbar';
  toolbarElement.id = 'cruse-scanviewer-2d-toolbar';
  element.appendChild(toolbarElement);

  this.viewer = OpenSeadragon({
    element: element,
    tileSources:   [fullUrl],
    toolbar: 'cruse-scanviewer-2d-toolbar',
  });

  if(imageSource.scale != undefined)
  {
    this.viewer.scalebar({
      type: 2,
      stayInsideImage: false,
      pixelsPerMeter: imageSource.scale * 1000,
      backgroundColor: "rgba(0,0,0,0.5)",
      fontColor: "rgba(255,255,255,0.5)",
      color: "rgba(255,255,255,0.5)", 
    });
  }
  
  // small hack to fix position: the viewer seems to switch the positon 
  // to relative. Also move it to the end of the elements to fix draw order
  toolbarElement.style.position = "absolute";

  var captionElement = document.createElement('div');
  captionElement.className = 'cruse-scanviewer-caption';
  element.appendChild(captionElement);

  if(imageSource.caption != undefined)
  {
    captionElement.innerHTML = imageSource.caption;
  } 
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