/* Cruse Gallery Widget 

   Based on Gallery Widget for IIPMooViewer 
   Copyright (c) 2016 Ruven Pillay <ruven@users.sourceforge.net>
   IIPImage: http://iipimage.sourceforge.net

   --------------------------------------------------------------------
   This program is free software; you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation; either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   --------------------------------------------------------------------
*/

import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
import Cruse2DViewer from 'cruse2DViewer/cruse-viewer';

'use strict';


/* Constructor
 */

var Gallery = function (id, options) {

  this.container = id || alert('No element ID given to Gallery constructor');
  this.current_image = 0;


  // Check type of provided images option. If an array, simply use it
  // Otherwise, if it's a string, use an Ajax request
  if (typeof (options.images) == "array") {
    this.images = options.images;
    window.addEvent('domready', this.create.bind(this));
  }
  else if (typeof (options.images) == "string") {

    var _this = this;
    // Make Ajax request    
    $.getJSON(options.images, function (json) {
      _this.images = json;
      $(document).ready(_this.create.bind(_this));
    }).fail(function () {
      alert("Failure obtaining json.");
    });
  }
  else alert("No recognizable list of images or URL provided");

};

Gallery.prototype = {
  /* Create our gallery widget
   */
  create: function (container) {

    var containerElement = document.getElementById(this.container);
    containerElement.className += ' gallery';

    var _this = this;




    // Create the cruse2DViewer container
    this.viewer2dElement = document.createElement('div');
    this.viewer2dElement.className = 'viewer';
    containerElement.appendChild(this.viewer2dElement);

    // Create the cruse3DViewer container
    this.viewer3dElement = document.createElement('div');
    this.viewer3dElement.className = 'viewer';
    containerElement.appendChild(this.viewer3dElement);

    // Create the main thumbnail container
    var thumbnail_container = document.createElement('div');
    thumbnail_container.className = 'thumbnails';
    thumbnail_container.mousewheel = function (e) {
      var delta = e.wheel;
      var sl = thumbnail_container.getScroll().x;
      sl -= (delta * 40);
      thumbnail_container.scrollTo(sl);
      e.preventDefault();
    };
    containerElement.appendChild(thumbnail_container);

    // Make the thumbnails draggable
    // new Drag(thumbnail_container, {
    //   style: false,
    //   invert: true,
    //   modifiers: { x: 'scrollLeft' }
    // });


    // Create the inner thumbnail div
    this.thumbnails = document.createElement('div');
    this.thumbnails.addEventListener('click', this.thumbnailClicked.bind(this));
    thumbnail_container.appendChild(this.thumbnails);

    // Create our thumbnails and viewer object
    this.updateViewer(this.images[0]);
    this.createThumbnails();

  },

  thumbnailClicked: function (event) {
    // Use event delegation for our thumbnail click events
    var clicked = event.target;
    if(clicked.tagName != 'IMG')
    {
      return;
    } 

    var index = parseInt(clicked.id.substr('thumbnail_'.length));

    if (index != this.current_image) {
      document.getElementById('thumbnail_' + this.current_image).className = '';

      var currentImage = this.images[this.current_image];

      // Record the current location
      if (this.is3DImage(currentImage)) {
        currentImage.view = this.scanViewerWidget.getCurrentViewPose();
      }
      else {
        currentImage.view = this.cruse2DViewer.getView();        
      }

      // Save the current index and update our viewer
      this.current_image = index;
      this.updateViewer(this.images[index]);
      clicked.className = 'selected';
    }
  },

  /* Create individual thumbnails
   */
  createThumbnails: function () {

    // Calculate height of thumbnail container
    var height = Math.floor(this.thumbnails.parentElement.getBoundingClientRect().y) - 20;
    var that = this;
    var thumbnails = this.thumbnails;
    this.images.forEach(function (i, index) {

      // Create our image URL ( limit our widths to at most 2*height )
      var src = "";

      if (that.is3DImage(i)) {
        src = (i.server || '/fcgi-bin/iipsrv.fcgi') + '?FIF=' + i.DiffuseColor +
          '&HEI=' + height + '&WID=' + (2 * height) + '&CVT=JPEG';
      }
      else {
        src = (i.server || '/fcgi-bin/iipsrv.fcgi') + '?FIF=' + i.image +
          '&HEI=' + height + '&WID=' + (2 * height) + '&CVT=JPEG';
      }

      // Create image and inject into our thumbnail container
      var thumbnail = document.createElement('img');
      thumbnail.id = 'thumbnail_' + index;
      thumbnail.src = src;
      thumbnail.title = i.title || null;  
      thumbnails.appendChild(thumbnail);
      
      if (index == 0) thumbnail.className = 'selected';

    });

  },

  is3DImage: function (image) {
    return 'NormalMap' in image;
  },

  /* Create our viewer object and load an image
   */
  updateViewer: function (image) {

    if (this.is3DImage(image)) {
      this.update3DViewer(image)
    }
    else {
      this.update2DViewer(image)
    }
  },

  update2DViewer: function (image) {

    this.viewer3dElement.style.display = "none";
    this.viewer2dElement.style.display = "block";

    if (this.scanViewerWidget != undefined) {
      this.scanViewerWidget.stop();
    }

    if (this.cruse2DViewer == undefined) {
      this.cruse2DViewer = new Cruse2DViewer(this.viewer2dElement, image);
    }
    else {
      var that = this;
      this.cruse2DViewer.open(image).then(function(){
        if(image.view != undefined)
        {
          that.cruse2DViewer.restoreView(image.view);
        } 
      });
    }
  },

  update3DViewer: function (image) {
    this.viewer2dElement.style.display = "none";
    this.viewer3dElement.style.display = "block";

    if (this.scanViewerWidget == undefined) {
      this.scanViewerWidget = new ScanViewerWidget(this.viewer3dElement);
    }
    else {
      this.scanViewerWidget.stop();
    }

    var that = this;
    this.scanViewerWidget.run(image).then(function () {
      if (image.view != undefined) {
        that.scanViewerWidget.setViewPose(image.view);
      }
    });
  },
};

export default Gallery;
