require('babel-register');
require('babel-polyfill');
let DefaultBuilder = require("truffle-default-builder");
let HDWalletProvider = require("truffle-hdwallet-provider");
let mnemonic = "endless kangaroo panic child mule thumb hover chase circle goddess swarm resemble";

module.exports = {
	build: new DefaultBuilder({
		"index.html": "index.html",
		"app.js": [
	  	  	"js/app.js"
	    ],
	    "three.js": [
	  	  	"js/three.js"
	    ],
	    "WebGL.js": [
	  	  	"js/WebGL.js"
	    ],
	    "GLTFLoader.js": [
	  	  	"js/GLTFLoader.js"
	    ],
	    "models/": "models/",
	    "textures/": "textures/"
	}),
	networks: {
		development: {
			host: 'localhost',
			port: 8545,
			network_id: '*', // eslint-disable-line camelcase
		},
		kovan: {
      		provider: function() {
        		return new HDWalletProvider(mnemonic, "https://kovan.infura.io/Yzep583owV0eYS8JFEF6")
      		},
      		network_id: 42,
    	},
	},
};
