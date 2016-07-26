/// <binding ProjectOpened='Run - Development' />
var path = require('path');
var webpack = require('webpack');

var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var Autoprefixer = require('autoprefixer');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var isProd = (process.env.NODE_ENV === 'production');

module.exports = function makeWebpackConfig() {

    var config = {};

    // add debug messages
    config.debug = !isProd;

    // clarify output filenames
    var outputfilename = 'dist/[name].js';
    if (isProd) {
        //config.devtool = 'source-map';
        outputfilename = 'dist/[name].[hash].js';
    }

    if (!isProd) {
        config.devtool = 'eval-source-map';
    }


    config.entry = {
        'polyfills': './angular2App/polyfills.ts',
        'vendor': './angular2App/vendor.ts',
        'app': './angular2App/boot.ts' // our angular app
    };


    config.output = {
        path: root('./wwwroot'),
        publicPath: isProd ? '' : 'http://localhost:5000/',
        filename: outputfilename,
        chunkFilename: isProd ? '[id].[hash].chunk.js' : '[id].chunk.js'
    };

    config.resolve = {
        cache: true,
        root: root(),
        extensions: ['', '.ts', '.js', '.json', '.css', '.scss', '.html'],
        alias: {
            'app': 'angular2App/app'
        }
    };

    config.module = {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'ts',
                query: {
                    'ignoreDiagnostics': [
                        2403, // 2403 -> Subsequent variable declarations
                        2300, // 2300 -> Duplicate identifier
                        2374, // 2374 -> Duplicate number index signature
                        2375, // 2375 -> Duplicate string index signature
                        2502 // 2502 -> Referenced directly or indirectly
                    ]
                },
                exclude: [/node_modules\/(?!(ng2-.+))/]
            },
            
            //For Copy fonts
           {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[hash].[ext]"
            }, {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/font-woff&name=fonts/[name].[hash].[ext]"
            }, {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=application/octet-stream&name=fonts/[name].[hash].[ext]"
            }, {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: "file?name=fonts/[name].[hash].[ext]"
            }, {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: "url?limit=10000&mimetype=image/svg+xml&name=fonts/[name].[hash].[ext]"
            },

            // copy those assets to output
            //{
                test: /\.(png|jpe?g|gif|ico)$/,
                loader: 'file?name=assets/[name].[hash].[ext]?'
            },

            // Support for *.json files.
            {
                test: /\.json$/,
                loader: 'json'
            },

            // Load css files which are required in vendor.ts
            {
                test: /\.css$/,
                exclude: root('angular2App', 'app'),
                loader: "style!css"
            },

            // Extract all files without the files for specific app components
            {
                test: /\.scss$/,
                exclude: root('angular2App', 'app'),
                loader: 'raw!postcss!sass'
            },

            // Extract all files for specific app components
            {
                test: /\.scss$/,
                exclude: root('angular2App', 'style'),
                loader: 'raw!postcss!sass'
            },

            {
                test: /\.html$/,
                loader: 'raw'
            }
        ],
        postLoaders: [],
        noParse: [/.+zone\.js\/dist\/.+/, /.+angular2\/bundles\/.+/, /angular2-polyfills\.js/]
    };


    config.plugins = [
        new CleanWebpackPlugin(['./wwwroot/dist']),
       
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify("production")
            }
        }),

        new CommonsChunkPlugin({
            name: ['vendor', 'polyfills']
        }),

        new HtmlWebpackPlugin({
            template: './angular2App/index.html',
            inject: 'body',
            chunksSortMode: packageSort(['polyfills', 'vendor', 'app'])
        }),

        new CopyWebpackPlugin([

            // copy all images to [rootFolder]/images
            { from: root('angular2App/images'), to: 'images' },

        ])
    ];


    // Add build specific plugins
    if (isProd) {
        config.plugins.push(
            new webpack.NoErrorsPlugin(),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin()
        );
    }

    config.postcss = [
        Autoprefixer({
            browsers: ['last 2 version']
        })
    ];

    return config;
}();

// Helper functions
function root(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return path.join.apply(path, [__dirname].concat(args));
}

function rootNode(args) {
    args = Array.prototype.slice.call(arguments, 0);
    return root.apply(path, ['node_modules'].concat(args));
}

function packageSort(packages) {
    // packages = ['polyfills', 'vendor', 'app']
    var len = packages.length - 1;
    var first = packages[0];
    var last = packages[len];
    return function sort(a, b) {
        // polyfills always first
        if (a.names[0] === first) {
            return -1;
        }
        // main always last
        if (a.names[0] === last) {
            return 1;
        }
        // vendor before app
        if (a.names[0] !== first && b.names[0] === last) {
            return -1;
        } else {
            return 1;
        }
    }
}
