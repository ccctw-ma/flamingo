const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const config = require("./webpack.config.js");

module.exports = (env, argv) => {
    console.log(argv)
    const useAnalyzer = argv.analyze;

    const plugins = [...config.plugins];

    if (useAnalyzer) {
        plugins.push(new BundleAnalyzerPlugin());
    }

    return {
        ...config,
        plugins,
    }
};
