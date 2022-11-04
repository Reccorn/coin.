/* eslint-disable no-undef */
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { extendDefaultPlugins } = require("svgo");

module.exports = {
    entry: './src/client/index.js',
    output: {
        filename: 'script.[contenthash].js',
        publicPath: '/',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif|ttf)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      ['@babel/preset-env', { targets: "defaults" }]
                    ]
                  }
                }
            },
            {
                test: /\.scss$/,
                use: [
                  'style-loader',
                  'css-loader',
                  'sass-loader'
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Coin.',
            hash: true
        }),
    ],
    devServer: {
        hot: true,
        historyApiFallback: true,
    },
    optimization: {
        minimizer: [
            "...",
            new ImageMinimizerPlugin({
            minimizer: {
                implementation: ImageMinimizerPlugin.imageminMinify,
                options: {
                plugins: [
                    ["gifsicle", { interlaced: true }],
                    ["jpegtran", { progressive: true }],
                    ["optipng", { optimizationLevel: 5 }],
                    [
                    "svgo",
                    {
                        plugins: extendDefaultPlugins([
                        {
                            name: "removeViewBox",
                            active: false,
                        },
                        {
                            name: "addAttributesToSVGElement",
                            params: {
                            attributes: [{ xmlns: "http://www.w3.org/2000/svg" }],
                            },
                        },
                        ]),
                    },
                    ],
                ],
                },
            },
            }),
        ],
    },
};
