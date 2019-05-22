const path = require('path');
const MinifyPlugin = require("babel-minify-webpack-plugin");

var demo_src = process.env.DEMO;

module.exports = {
    mode: process.env.MODE || "development",
    entry: ["./src/vchart.js"],
    output: {
        path: path.join(__dirname, "."),
        filename: "./dist/vchart.js"
    },
    resolve: {
        modules: [
            './node_modules'
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: {
                    presets: ["@babel/preset-env"]//,
                    // plugins: [
                    //     'transform-jsx-to-absol'
                    //     // ,
                    //     // '@babel/transform-literals'
                    // ]
                }
            },
            {
                test: /\.(tpl|txt|xml|rels|css)$/i,
                use: 'raw-loader',
            }
        ]
    },
    devServer: {
        compress: true
    },
    performance: {
        hints: false
    },
    plugins: [
        new MinifyPlugin()
    ]
};