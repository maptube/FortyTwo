/**
* DataLayer prototype for layers that have static content.
* Basically a helper for loading different types of data that doesn't animate.
*
*/
function StaticDataLayer() {
	this.bbox = null;
	this.url = "";
	this.mesh = null;
}
	
StaticDataLayer.prototype.setURL = function(u) { this.url = u; };
	
StaticDataLayer.prototype.animate = function(earth) {};
	
StaticDataLayer.prototype.load = function(earth,ondataloaded) {
	//determine type of data in url and use appropriate loader
	var ext = extractFileExtension(this.url);
	console.log("file extension="+ext);
	ext=ext.toLowerCase();
	if (ext==".dae")
		this.loadCollada(earth,this.url,ondataloaded);
	else if (ext==".obj")
		this.loadOBJ(earth,this.url,ondataloaded);
	//else if (ext==".geojson")
	//else if (ext==".json")
		
};

//TODO: this needs to be fixed... lifted straight from main program	
//var mesh_world = null;
/**
* loadColladaWorld
* @param filename The file to load - must be Collada (DAE) in cartesian coords
*/
StaticDataLayer.prototype.loadCollada = function (earth,filename,ondataloaded) {
	var loader = new THREE.ColladaLoader();
	loader.options.convertUpAxis = true;
	loader.options.upAxis='Y';
	loader.load(filename,
		function (inner_parent) {
			return function callback(collada) {
				inner_parent.mesh = new THREE.Object3D();
				inner_parent.mesh.name=extractFilenameWithoutExtension(filename);
				//var mat_simple = new THREE.MeshBasicMaterial( { color: 0x808080, wireframe: false } );
				//var mat_simple = new THREE.MeshLambertMaterial( { color: 0x808080, ambient: 0x808080, wireframe: false } );
				//var mat_simple = new THREE.MeshLambertMaterial( { color: 0x808080, ambient: 0x808080, wireframe: false, transparent: true } );
				var defaultMaterial = new THREE.MeshLambertMaterial( { color: 0x808080, ambient: 0x808080, wireframe: false, transparent: true } );
				for (var i in collada.scene.children) {
					//pull the basic colour from collada file, but put it into our own material - don't trust collada material imports
					var mat = collada.scene.children[i].material;
					if (!mat) { mat = defaultMaterial; }
					var mat_simple = new THREE.MeshLambertMaterial( { color: mat.color, ambient: mat.color, wireframe: false, transparent: true } );
					mat_simple.opacity=0.8;
					var g = collada.scene.children[i].geometry;
					var mesh = new THREE.Mesh(g,mat_simple);
					inner_parent.mesh.add(mesh);
				}
				inner_parent.mesh.doubleSided=true;
				earth.add(inner_parent.mesh);
				//if you get rid of the debug bounding box, you will have to compute the bbox here
				//var bbox = DEBUG_addBoundingBox(my_mesh_world);
				//dataBounds.union(bbox);
				//calculate data bounding box
				this.bbox = getCompoundBoundingBox(mesh);
				if (ondataloaded) ondataloaded.call(); //report back that we've loaded the data (needs to be in the callback loop)
			}
		}(this)
	);
};
	
StaticDataLayer.prototype.loadOBJ = function (earth,filename,ondataloaded) {
	var loader = new THREE.OBJLoader();
	loader.load(filename,
		function (inner_parent) {
			return function callback(obj) {
				inner_parent.mesh = obj;
				inner_parent.mesh.name=extractFilenameWithoutExtension(filename);
				earth.add(inner_parent.mesh);
				this.bbox = getCompoundBoundingBox(inner_parent.mesh);
			}
		}(this)
	);
};
