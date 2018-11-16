// Variable for the scene
if ( WEBGL.isWebGLAvailable() === false ) {
	document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}
var camera, scene, renderer, dirLight, dirLightHeper, hemiLight, hemiLightHelper;
var mixers = [];
var clock = new THREE.Clock();
var vertexShader, fragmentShader;

// Variables for web3
var account, web3Provider;
var token, breeder, selected_bird;

window.onload = function() {
	initScene();
	initContracts();
	animate();
}

function initScene() {
	var container = document.getElementById( 'container' );
	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 0, 0, 250 );
	scene = new THREE.Scene();
	scene.background = new THREE.Color().setHSL( 0., 0.2, 0.5 );
	scene.fog = new THREE.Fog( scene.background, 1, 5000 );

	// LIGHTS
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	hemiLight.color.setHSL( 0.6, 1, 0.6 );
	hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 50, 0 );
	scene.add( hemiLight );

	dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	dirLight.color.setHSL( 0.1, 1, 0.95 );
	dirLight.position.set( - 1, 1.75, 1 );
	dirLight.position.multiplyScalar( 30 );
	scene.add( dirLight );

	dirLight.castShadow = true;
	dirLight.shadow.mapSize.width = 2048;
	dirLight.shadow.mapSize.height = 2048;
	var d = 50;
	dirLight.shadow.camera.left = - d;
	dirLight.shadow.camera.right = d;
	dirLight.shadow.camera.top = d;
	dirLight.shadow.camera.bottom = - d;
	dirLight.shadow.camera.far = 3500;
	dirLight.shadow.bias = - 0.0001;

	vertexShader = document.getElementById( 'vertexShader' ).textContent;
	fragmentShader = document.getElementById( 'fragmentShader' ).textContent;

	displayGround(0);
	displaySky(0);

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	window.addEventListener( 'resize', onWindowResize, false );
}

async function updateInfo() {
	console.log('contracts: ' + breeder.address + ', ' + token.address);
	var tokens = []
	while (true) {
		try {
			var token_id = await token.tokenOfOwnerByIndex.call(account, tokens.length);
			console.log(token_id.toNumber());
			tokens.push(token_id);
		} catch (error) {
			break;
		}
	}

	var eth_balance = await web3.fromWei(web3.eth.getBalance(account));
	$( "#balance" ).text('Your balance: ' + eth_balance.toNumber() + ' ETH');

	$( "#birds_list" ).empty();
	for (var i = tokens.length - 1; i >= 0 ; i--) {
	    $( "#birds_list" ).append("<option value=" + tokens[i] + ">Bird #" + tokens[i] + "</option>");
	}

	if (tokens.length > 0) {
		selected_bird = tokens[tokens.length-1].toNumber();
		displayBird(selected_bird);
		displaySky(selected_bird);
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
	var delta = clock.getDelta();
	for ( var i = 0; i < mixers.length; i ++ ) {
		mixers[ i ].update( delta );
	}
	renderer.render( scene, camera );
}

async function initContracts() {

	// await connectMetamask();
	await connectGanache();

	setupAccount();
    initCryptoBirds();
}

async function connectMetamask() {
	if (window.ethereum) {
	  web3Provider = window.ethereum;
	  try {
	    // Request account access
	    await window.ethereum.enable();
	  } catch (error) {
	    // User denied account access...
	    console.error("User denied account access")
	  }
	} else if (window.web3) {
	  web3Provider = window.web3.currentProvider;
	} else {
	  web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
	}
	web3 = new Web3(web3Provider);
}

async function connectGanache() {
	web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
	web3 = new Web3(web3Provider);
}

function setupAccount() {
	web3.eth.getAccounts(function(err, accs) {
        if (err !== null) {
            alert("There was an error fetching your accounts.");
            return;
        }

        if (accs.length === 0) {
            alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
            return;
        }

        account = accs[0];
        console.log('account: ' + account);
    });
}


function initCryptoBirds() {
	$.getJSON('contracts/CryptoBirds.json', function(data) {
	    var artifact = data;
	    CryptoBirds = TruffleContract(artifact);
	    CryptoBirds.setProvider(web3Provider);

	    CryptoBirds.deployed().then(function(instance) {
	        token = instance;
	    }).then(initBreeder);
	});
}

function initBreeder() {
	$.getJSON('contracts/Breeder.json', function(data) {
	    var artifact = data;
	    Breeder = TruffleContract(artifact);
	    Breeder.setProvider(web3Provider);

	    Breeder.deployed().then(function(instance) {
	        breeder = instance;
	    }).then(updateInfo);
	});
}

function displayBird(id) {
	var tex = new THREE.TextureLoader().load('textures/' + (id % 13) + '.jpg');
	tex.flipY = false; // for glTF models.

	mixers = []
	var oldBird = scene.getObjectByName('bird');
	scene.remove(oldBird);

	// MODEL
	var loader = new THREE.GLTFLoader();
	loader.load('models/flamingo.glb', function ( gltf ) {
		var bird = gltf.scene.children[ 0 ];
		var s = 0.35;
		bird.scale.set( s, s, s );
		bird.position.y = 15;
		bird.rotation.y = - 1.;
		bird.castShadow = true;
		bird.receiveShadow = true;
		bird.material.map = tex;
		bird.name = 'bird';
		scene.add( bird );
		var mixer = new THREE.AnimationMixer( bird );
		mixer.clipAction( gltf.animations[ 0 ] ).setDuration( 1 ).play();
		mixers.push( mixer );
	} );
}

function displayGround(id) {

	var oldGround = scene.getObjectByName('ground');
	scene.remove(oldGround);

	var groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
	var groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x050505 } );
	groundMat.color.setHSL( 0.33, 0.49, 0.27 );
	var ground = new THREE.Mesh( groundGeo, groundMat );
	ground.rotation.x = - Math.PI / 2;
	ground.position.y = - 33;
	scene.add( ground );
	ground.name = 'ground';
	ground.receiveShadow = true;
}

function displaySky(id) {

	var oldSky = scene.getObjectByName('sky');
	scene.remove(oldSky);

	var skyBottomColors = [0xFCD440, 0xFCD440, 0x272d59, 0x290887, 0xb2f9ff, 0xf2fcff]
	var skyTopColors = [0x0011ff, 0x030a6b, 0x7700c6, 0x2b1f42, 0x00a9d8, 0xffe2bc]

	var uniforms = {
		topColor: { value: new THREE.Color( skyBottomColors[(id * 273) % 6] ) },
		bottomColor: { value: new THREE.Color( skyTopColors[(id * 451) % 6] ) },
		offset: { value: 33 },
		exponent: { value: 0.6 }
	};

	scene.fog.color.copy( uniforms.bottomColor.value );
	var skyGeo = new THREE.SphereBufferGeometry( 4000, 32, 15 );
	var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
	var sky = new THREE.Mesh( skyGeo, skyMat );
	sky.name = 'sky';
	scene.add( sky );
}

$( "#buy" ).click(async function() {
	last_price = await token.last_price.call();
	token.buy({ from: account, value: last_price, gas: 200000 }).then(updateInfo);
});

$( "#sell" ).click(async function() {
	token.sell(selected_bird, { from: account, gas: 200000 }).then(updateInfo);
});

$( "#breed" ).click(async function() {
  alert( "Not implemented!" );
});

$( "#birds_list" ).on("change", function() {
	selected_bird = this.value;
	displayBird(selected_bird);
	displaySky(selected_bird);
});

