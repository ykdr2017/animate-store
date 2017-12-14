/*
 |--------------------------------------------------------------------------
 | Webpack config file
 |--------------------------------------------------------------------------
 */

const path = require('path');
const UglifyPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
	context: __dirname,
	target: 'node',
	externals: [nodeExternals()],
	entry: {
		main: ['./src/ts/main']
	},
	output: {
		path: __dirname,
		filename: './dist/js/index.js', //'./[id].[name].js'
		//library: '',
		libraryTarget: 'umd'
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		alias: {
        	'@src': path.resolve(__dirname, 'src'),
            '@test': path.resolve(__dirname, 'test')
		}
	},
	plugins: [
		new UglifyPlugin()
	],
	module: {
		rules: [{
			resource: {
				test: /\.tsx?$/,
				exclude: /node_modules/
			},
			use: {
				loader: 'ts-loader'
			}
		}]
	},
	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	}
};
