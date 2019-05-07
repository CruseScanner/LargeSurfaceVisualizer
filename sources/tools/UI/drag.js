
'use strict';


/* Constructor
 */

var Drag = function (element, activeClassName) {
    this.element = element || alert('No element given to Gallery constructor');
    var startX;
    var scrollLeft;

    const onMouseUp = (e) => {
        e.preventDefault();

        if (activeClassName != undefined)
            element.classList.remove(activeClassName);
    
        window.removeEventListener('mouseup', onMouseUp);  
        window.removeEventListener('mousemove', onMouseMove);  
    };
  
    const onMouseMove = (e) => {
        e.preventDefault();
        const x = e.pageX - this.element.offsetLeft;
        const walk = (x - startX) * 3; //scroll-fast
        element.scrollLeft = scrollLeft - walk;
    };

    this.element.addEventListener('mousedown', (e) => {
 
        if(activeClassName != undefined)
            element.classList.add(activeClassName);

        startX = e.pageX - this.element.offsetLeft;
        scrollLeft = this.element.scrollLeft;

        window.addEventListener('mouseup', onMouseUp);  
        window.addEventListener('mousemove', onMouseMove);  
    });
}

export default Drag;