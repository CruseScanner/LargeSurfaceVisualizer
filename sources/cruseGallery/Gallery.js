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
import IIPMooViewer from 'cruse2DViewer/cruse-viewer.js';

'use strict';


  /* Constructor
   */

var Gallery = function( id, options ){

    this.container = id || alert('No element ID given to Gallery constructor');
    this.current_image = 0;


    // Check type of provided images option. If an array, simply use it
    // Otherwise, if it's a string, use an Ajax request
    if( typeOf(options.images) == "array" ){
      this.images = options.images;
      window.addEvent( 'domready', this.create.bind(this) );
    }
    else if( typeOf(options.images) == "string" ){

      var _this = this;
      // Make Ajax request
      var metadata = new Request.JSON({
        method: 'get',
        secure: true,
        encoding: 'utf-8',
        url: options.images,
        onSuccess: function(json){
	  _this.images = json;
	  window.addEvent( 'domready', _this.create.bind(_this) );
	},
	onError: function(text,error){
	  alert("Error obtaining json: " + error);
	  },
	onFailure: function(text,error){
	  alert("Failure obtaining json: " + error);
	}
      }).get();
    }
    else alert( "No recognizable list of images or URL provided" );

  };

Gallery.prototype = {
  /* Create our gallery widget
   */
  create: function( container ){

    document.id(this.container).addClass('gallery');

    var _this = this;

    // Create the iipmooviewer container
     this.viewer2dElement = new Element( 'div',{
       'class': 'viewer'
     }).inject(this.container);

    this.viewer3dElement = new Element( 'div',{
      'class': 'viewer'
    }).inject(this.container);

    // Create the main thumbnail container
    var thumbnail_container = new Element('div', {
      'class': 'thumbnails',
      'events': {
	'mousewheel': function(e){						
  	  var delta = e.wheel;
 	  var sl = thumbnail_container.getScroll().x;
	  sl -= (delta*40);
  	  thumbnail_container.scrollTo(sl);
	  e.preventDefault();				
	}
      }
    }).inject(this.container);


    // Make the thumbnails draggable
    new Drag( thumbnail_container, {
      style: false,
      invert: true,
      modifiers: {x: 'scrollLeft'}
    });


    // Create the inner thumbnail div
    this.thumbnails = new Element( 'div', {
      'events': {
        // Use event delegation for our thumbnail click events
	'click:relay(img)': function(event, clicked){

	  var index = parseInt( clicked.get('id').substr('thumbnail_'.length) );

	  if( index != _this.current_image ){
	    _this.thumbnails.getElement('img#thumbnail_'+_this.current_image).removeClass('selected');


      var currentImage = _this.images[_this.current_image];

	    // Record the current location
      if(_this.is3DImage(currentImage))
      {
          currentImage.view = _this.scanViewerWidget.getCurrentViewPose();
      }
      else
      {
        currentImage.view = {
          x: (_this.iipmooviewer.view.x + (_this.iipmooviewer.view.w/2)) / _this.iipmooviewer.wid,
          y: (_this.iipmooviewer.view.y + (_this.iipmooviewer.view.h/2)) / _this.iipmooviewer.hei,
          resolution: _this.iipmooviewer.view.res
        };
      }

	    // Save the current index and update our viewer
	    _this.current_image = index;
	    _this.updateViewer( _this.images[index] );
	    clicked.addClass('selected');
	  }
	}
      }
    }).inject(thumbnail_container);


    // Create our thumbnails and viewer object
    this.updateViewer(this.images[0]);
    this.createThumbnails();

  },


  /* Create individual thumbnails
   */
  createThumbnails: function(){

    // Calculate height of thumbnail container
    var height = Math.floor( this.thumbnails.getParent().getSize().y ) - 20;
    var that = this;
    var thumbnails = this.thumbnails;
    Array.each(this.images, function(i,index){

      // Create our image URL ( limit our widths to at most 2*height )
      var src = "";
    
      if(that.is3DImage(i))
      {
        src = (i.server||'/fcgi-bin/iipsrv.fcgi') + '?FIF=' + i.DiffuseColor +
        '&HEI=' + height + '&WID=' + (2*height) + '&CVT=JPEG';
      }
      else
      {
        src = (i.server||'/fcgi-bin/iipsrv.fcgi') + '?FIF=' + i.image +
        '&HEI=' + height + '&WID=' + (2*height) + '&CVT=JPEG';
      }

      // Create image and inject into our thumbnail container
      var thumbnail = new Element( 'img', {
	'src': src,
	'id': 'thumbnail_' + index,
        'title': i.title || null
      }).inject(thumbnails);

      if( index == 0 ) thumbnail.addClass('selected');

    });

  },

  is3DImage: function(image){
    return 'NormalMap' in image;
  },

  /* Create our viewer object and load an image
   */
  updateViewer: function(image){
    
    if(this.is3DImage(image))
    {
      this.update3DViewer(image)
    }
    else
    {
      this.update2DViewer(image)
    }
  },

  update2DViewer: function(image){

    this.viewer3dElement.style.display = "none";
    this.viewer2dElement.style.display = "block";
    
    if(this.scanViewerWidget != undefined)
    {
       this.scanViewerWidget.stop();
    }

    if(this.iipmooviewer == undefined)
    {
      this.iipmooviewer = new IIPMooViewer( this.viewer2dElement, {
        server: image.server || null,
        prefix: 'images/',
        render: 'spiral',
        image: image.image,
        credit: image.caption,
        scale: image.scale || null,
        viewport: image.view || null,
        navigation: {buttons: ['zoomIn','zoomOut','reset','rotateLeft','rotateRight']}
      });
    }
    else{
      this.iipmooviewer.server = image.server || null;
      this.iipmooviewer.setCredit( '<a href="' + image.caption + '" type="application/octet-stream" style="color:#fff"><img src="../cruseviewer/images/download.png" /></a>');
      this.iipmooviewer.viewport = image.view || null;
      this.iipmooviewer.changeImage( image.image );  
    }
  },

  update3DViewer: function(image){
    this.viewer2dElement.style.display = "none";
    this.viewer3dElement.style.display = "block";

    if(this.scanViewerWidget == undefined)
    {
      this.scanViewerWidget = new ScanViewerWidget( this.viewer3dElement);
    }

    var that = this;
    this.scanViewerWidget.run(image).then(function(){
      if(image.view != undefined)
      {
        that.scanViewerWidget.setViewPose(image.view);
      }  
    });
  },
};

export default Gallery;
