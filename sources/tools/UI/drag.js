
'use strict';


/* Constructor
 */

var Drag = function (element, activeClassName) {
    this.element = element || alert('No element given to Gallery constructor');
    var startX;
    var scrollLeft;
    var that = this;

    const onMouseUp = function(e) {
        e.preventDefault();

        if (activeClassName != undefined)
            element.classList.remove(activeClassName);
    
        window.removeEventListener('mouseup', onMouseUp);  
        window.removeEventListener('mousemove', onMouseMove);  
    };
  


    const onMouseMove = function(e) {
        e.preventDefault();
        const x = e.pageX - that.element.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        element.scrollLeft = scrollLeft - walk;
    };

    this.element.addEventListener('mousedown', function (e) {
 
        if(activeClassName != undefined)
            element.classList.add(activeClassName);

        startX = e.pageX - that.element.offsetLeft;
        scrollLeft = that.element.scrollLeft;

        window.addEventListener('mouseup', onMouseUp);  
        window.addEventListener('mousemove', onMouseMove);  
        
        e.preventDefault();
    });
}

export default Drag;