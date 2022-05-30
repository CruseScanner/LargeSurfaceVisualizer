The LargeSurfaceVisualizer is a software module to visualize arbitrary large raster or image data in 2D and 3D.
Using an iipimage server and javascript, the LargeSurfaceVisualizer can render very high-resolution images such as scanned surfaces, Terrains/DEMs, or other 2.5D datasets in your browser.

An example can be found under https://samples.crusescanner.com/3dviewer.php?3d_fineart


# Building
Please check out the repository including its submodules. The project requires a custom osgjs version, that is checked out automatically. 

## Building osgjs
Go to ./sources/external and install the required packages
> cd ./sources/external
> npm install

Once all dependencies are install you can use grunt to build osgjs
> grunt build-release

Upon succesfull build two files are create
> ./sources/external/OSG.js
> ./sources/external/OSG.min.js


## Building the LargeSurfaceVisualizer
Go to the root directory of your project and install the required packages
> npm install

Once all dependencies are install you can use grunt to build and test the LargeSurfaceVisualizer
> grunt build-release

Builds the project to
> ./builds/dist/cruse.js
> ./builds/dist/cruse.min.js

# Examples
In order to test the LargeSurfaceVisualizer, different examples are provided. 
To run the examples and tests call
> grunt serve

This will open a local server on
> http://localhost:9000/

The source code of the examples can be found in the examples folder. 
For these examples all iipserver requests are forwared to one of Cruse's iip-servers.
