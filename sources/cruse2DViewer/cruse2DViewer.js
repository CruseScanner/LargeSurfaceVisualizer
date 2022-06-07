import OpenSeadragon from 'openseadragon';
import 'external/openseadragon-scalebar';

<<<<<<< HEAD
var Cruse2DViewer = function(containerElementOrID, imageSource){
  
  if(typeof(containerElementOrID) == 'string')
  {
    containerElementOrID = document.getElementById(containerElementOrID);
  }

  var element = document.createElement('div');
  element.style.position = "absolute";
  element.style.width = "100%";
  element.style.height = "100%";
  containerElementOrID.appendChild(element);

  this.viewer = OpenSeadragon({
    element: element,
    showNavigationControl: false,
  });

  this.open(imageSource);
};

Cruse2DViewer.prototype = {
  getView : function() 
  {
    return this.viewer.viewport.getBounds();
  },

  restoreView : function(view)
  {
    this.viewer.viewport.fitBounds(view, true);
  },

  open: function(imageSource)
  {
    if(imageSource == undefined)
    {
      return;
    }

    var prefix = imageSource.prefix || '?IIIF='
    var fullUrl = imageSource.server + prefix + imageSource.image + '/info.json';  
 
    var that = this;
    var result = new Promise(function (resolve) {
      that.viewer.addOnceHandler("open", function openedListener() {                   
          resolve();
      });
    });
  
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

    return result;
  },

  zoomIn : function(){
    if ( this.viewer.viewport ) {
      this.viewer.viewport.zoomBy(
          this.viewer.zoomPerClick / 1.0
      );
      this.viewer.viewport.applyConstraints();
    }
  },

  zoomOut : function(){
    if ( this.viewer.viewport ) {
      this.viewer.viewport.zoomBy(
          1.0 / this.viewer.zoomPerClick 
      );
      this.viewer.viewport.applyConstraints();
    }
  },

  resetView : function()
  {
    if ( this.viewer.viewport ) {
      this.viewer.viewport.goHome();
    }
  },
};

export default Cruse2DViewer;
=======
var Cruse2DViewer = function (containerElementOrID, imageSource) {
    if (typeof containerElementOrID == 'string') {
        containerElementOrID = document.getElementById(containerElementOrID);
    }

    var element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.width = '100%';
    element.style.height = '100%';
    containerElementOrID.appendChild(element);

    this.viewer = OpenSeadragon({
        element: element,
        showNavigationControl: false
    });

    this.open(imageSource);
};

Cruse2DViewer.prototype = {
    getView: function () {
        return this.viewer.viewport.getBounds();
    },

    restoreView: function (view) {
        this.viewer.viewport.fitBounds(view, true);
    },

    open: function (imageSource) {
        if (imageSource == undefined) {
            return;
        }

        var prefix = imageSource.prefix || '?IIIF=';
        var fullUrl = imageSource.server + prefix + imageSource.image + '/info.json';

        var that = this;
        var result = new Promise(function (resolve) {
            that.viewer.addOnceHandler('open', function openedListener() {
                resolve();
            });
        });

        this.viewer.open(fullUrl);

        if (imageSource.scale != undefined) {
            this.viewer.scalebar({
                type: 2,
                stayInsideImage: false,
                pixelsPerMeter: imageSource.scale * 1000,
                backgroundColor: 'rgba(0,0,0,0.5)',
                fontColor: 'rgba(255,255,255,0.5)',
                color: 'rgba(255,255,255,0.5)'
            });
        } else {
            this.viewer.scalebar({
                type: 0
            });
        }

        return result;
    },

    zoomIn: function () {
        if (this.viewer.viewport) {
            this.viewer.viewport.zoomBy(this.viewer.zoomPerClick / 1.0);
            this.viewer.viewport.applyConstraints();
        }
    },

    zoomOut: function () {
        if (this.viewer.viewport) {
            this.viewer.viewport.zoomBy(1.0 / this.viewer.zoomPerClick);
            this.viewer.viewport.applyConstraints();
        }
    },

    resetView: function () {
        if (this.viewer.viewport) {
            this.viewer.viewport.goHome();
        }
    }
};

export default Cruse2DViewer;
>>>>>>> UpdateToNewerDependencies
