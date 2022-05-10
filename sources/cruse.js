import IIPImageTileSource from 'cruse3DViewer/IIPImageTileSource';
import ScanViewer from 'cruse3DViewer/ScanViewer';
import PlanarOrbitManipulator from 'cruse3DViewer/PlanarOrbitManipulator';
import ScanViewerWidget from 'cruse3DViewer/ScanViewerWidget';
import Gallery from 'cruseGallery/Gallery';
import Cruse2DViewer from 'cruse2DViewer/cruse2DViewer';
import cruseNameSpace from 'cruseNameSpace';
import CruseViewer from 'cruseViewer/cruseViewer';

var cruse = cruseNameSpace;
cruse.IIPImageTileSource = IIPImageTileSource;
cruse.PlanarOrbitManipulator = PlanarOrbitManipulator;
cruse.ScanViewer = ScanViewer;
cruse.ScanViewerWidget = ScanViewerWidget;
cruse.Cruse2DViewer = Cruse2DViewer;
cruse.Gallery = Gallery;
cruse.CruseViewer = CruseViewer;

// for backward compatibility
cruse.globalify = function () {
    window.cruse = cruse;
};

export {
    IIPImageTileSource,
    ScanViewer,
    PlanarOrbitManipulator,
    ScanViewerWidget,
    Gallery,
    Cruse2DViewer,
    CruseViewer
};

export default cruse;
