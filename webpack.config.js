'use strict';

/*eslint-env node*/

var webpack = require('webpack');

var path = require('path');
var ROOT_PATH = __dirname;
var SOURCES_PATH = path.join(ROOT_PATH, 'sources');
var VENDORS_PATH = path.join(ROOT_PATH, '/examples/vendors');
var NODE_PATH = path.join(ROOT_PATH, 'node_modules');
var BUILD_PATH = path.join(ROOT_PATH, 'builds/dist/');
var BUILD_TESTS_PATH = path.join(ROOT_PATH, 'builds/tests/');

var resolve = {
    modules: [SOURCES_PATH, VENDORS_PATH, ROOT_PATH, NODE_PATH]
};

var externals = [
    {
        zlib: {
            root: 'Zlib',
            commonjs2: 'zlib',
            commonjs: 'zlib',
            amd: 'zlib'
        }
<<<<<<< HEAD
    },    
=======
    },
>>>>>>> UpdateToNewerDependencies
    {
        hammer: {
            root: 'Hammer',
            commonjs2: 'hammerjs',
            commonjs: 'hammerjs',
            amd: 'hammer'
        }
    },
    {
        leap: {
            root: 'Leap',
            commonjs2: 'leapjs',
            commonjs: 'leapjs',
            amd: 'leap'
        }
    },
    {
        jquery: {
            root: '$',
            commonjs2: 'jquery',
            commonjs: 'jquery',
            amd: 'jquery'
        }
    }
];

var mainlibConfig = {
    entry: './sources/cruse.js',
    output: {
        path: BUILD_PATH,
        filename: 'cruse.js',
        libraryTarget: 'umd',
        library: 'cruse'
    },
    externals: externals,
    resolve: resolve,
    module: {
        rules: [
            {
                test: /\.(frag|vert|glsl)$/,
                use: 'raw-loader'
            }
        ]
    },
    devtool: 'eval',
    plugins: [
        new webpack.BannerPlugin(
<<<<<<< HEAD
            ['Cruse Webscanviewer', 'Cruse Spezialmaschienen Gmbh (www.crusescanner.com)'].join('\n')
=======
            [
                'Cruse LargeSurfaceVisualizer',
                'Cruse Spezialmaschienen Gmbh (www.crusescanner.com)'
            ].join('\n')
>>>>>>> UpdateToNewerDependencies
        )
    ],
};

var testconfig = {
    entry: {
<<<<<<< HEAD
        tests: ['./tests/tests.js'],        
    },
    output: {
        path: BUILD_TESTS_PATH,
        filename: '[name].js',       
=======
        tests: ['./tests/tests.js']
    },
    output: {
        path: BUILD_TESTS_PATH,
        filename: '[name].js'
>>>>>>> UpdateToNewerDependencies
    },
    resolve: {
        fallback: {
            fs: false
        }
    },
    target: 'node',
    externals: externals,
    resolve: resolve,
    module: {
        rules: [
            {
                // shaders
                test: /\.(frag|vert|glsl)$/,
                use: 'raw-loader'
            }
        ]
    },
    devtool: 'eval',
    plugins: [
        new webpack.BannerPlugin(
            ['OSGJS', 'Cedric Pinson <trigrou@trigrou.com> (http://cedricpinson.com)'].join('\n')
        )
    ]
};

module.exports = [mainlibConfig, testconfig];
