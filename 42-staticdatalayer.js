/**
* DataLayer prototype for layers that have static content.
* Basically a helper for loading different types of data.
*
*/
var StaticDataLayer = {
	bbox : null,
	url : "",
	setURL : function(u) { url = u; },
	animate : function(earth) {},
	load : function(earth) {
		//determine type of data in url and use appropriate loader
	}
	

//TODO: this needs to be fixed... lifted straight from main program	
	//var mesh_world = null;
/**
* loadColladaWorld
* @param filename The file to load - must be Collada (DAE) in cartesian coords
*/
function loadColladaWorld(filename) {
	//var loader = new THREE.JSONLoader();
	//loader.load('data/TM_WORLD_BORDERS-0.3.js', function callback(geom) {
	//	//world-borders is a geometry only javascript file
	//	mesh_world = new THREE.Object3D();
	//	var mat_simple = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );
	//	var mesh = new THREE.Mesh(geom,mat_simple);
	//	mesh_world.add(mesh);
	//	//mesh_world.scale.x = mesh_world.scale.y = mesh_world.scale.z = 0.01;
	//	earth.add(mesh_world);
	//});
	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.options.upAxis='Y';
	//loader.load('data/TM_WORLD_BORDERS-0.3.DAE', function callback(collada) {
	//loader.load('data/TM_WORLD_BORDERS_SIMPL-0.3.DAE', function callback(collada) {
	loader.load(filename, function callback(collada) {
		var my_mesh_world = new THREE.Object3D();
		my_mesh_world.name=extractFilenameWithoutExtension(filename);
		//var mat_simple = new THREE.MeshBasicMaterial( { color: 0x808080, wireframe: false } );
		//var mat_simple = new THREE.MeshLambertMaterial( { color: 0x808080, ambient: 0x808080, wireframe: false } );
		//var mat_simple = new THREE.MeshLambertMaterial( { color: 0x808080, ambient: 0x808080, wireframe: false, transparent: true } );
		for (var i in collada.scene.children) {
			//pull the basic colour from collada file, but put it into our own material - don't trust collada material imports
			var mat = collada.scene.children[i].material;
			var mat_simple = new THREE.MeshLambertMaterial( { color: mat.color, ambient: mat.color, wireframe: false, transparent: true } );
			mat_simple.opacity=0.8;
			var g = collada.scene.children[i].geometry;
			var mesh = new THREE.Mesh(g,mat_simple);
			my_mesh_world.add(mesh);
		}
		my_mesh_world.doubleSided=true;
		earth.add(my_mesh_world);
		//if you get rid of the debug bounding box, you will have to compute the bbox here
		var bbox = DEBUG_addBoundingBox(my_mesh_world);
		dataBounds.union(bbox);
		updateCamera();
	});
}

};