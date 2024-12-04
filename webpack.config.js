const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = {
    entry: "./src/index.js", // Your main JavaScript file
    output: {
        filename: "bundle.js", // The bundled output file
        path: path.resolve(__dirname, "dist"), // Output directory
        clean: true, // Clean the output directory before each build
    },
    mode: "development",
    devServer: {
        static: "./dist",
        port: 8000, // Development server port
    },
    module: {
        rules: [
            {
                test: /\.css$/, // Match CSS files
                use: ["style-loader", "css-loader"], // Loaders for CSS
            },
            {
                test: /\.html$/, // Match HTML files
                use: ["html-loader"], // Loader for HTML
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html", // Template HTML file
        }),
        new Dotenv(), // Use dotenv-webpack
    ],
};

