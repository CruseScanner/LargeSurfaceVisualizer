import OpenSeadragon from 'openseadragon';
import 'external/openseadragon-scalebar';

var Cruse2DViewer = function(element, imageSource){
  
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
    toolbar: 'cruse-scanviewer-2d-toolbar',
  });

  // small hack to fix position: the viewer seems to switch the positon 
  // to relative. 
  toolbarElement.style.position = "absolute";

  this.captionElement = document.createElement('div');
  this.captionElement.className = 'cruse-scanviewer-caption';
  element.appendChild(this.captionElement);

  this.open(imageSource);
};

Cruse2DViewer.prototype = {
  getView : function() 
  {
    return this.viewer.viewport.getBounds();
  },

  restoreView : function(view)
  {
    this.viewer.viewport.fitBounds(view);
  },

  open: function(imageSource)
  {
    if(imageSource == undefined)
    {
      return;
    }

    var prefix = imageSource.prefix || '?IIIF='
    var fullUrl = imageSource.server + prefix + imageSource.image + '/info.json';  
 
    this.viewer.open(fullUrl);
  
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
    else
    {
      this.viewer.scalebar(
        {
          type: 0,
        });      
    }
    
    if(imageSource.caption != undefined)
    {
      this.captionElement.style.visibility = "visible";
      this.captionElement.innerHTML = imageSource.caption;
    } 
    else{
      this.captionElement.style.visibility = "hidden";
    }
  }
};

export default Cruse2DViewer;