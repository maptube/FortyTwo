//function DataLayer() {}
//function DataLayer.prototype.load() {}
//function DataLayer.prototype.animate() {}
//TubeDataLayer.prototype = Object.create(DataLayer.prototype);

var DataLayer = {
	bbox: new THREE.Box3(),
	load: function(earth,ondataloaded) {},
	animate: function(earth) {}
};
//var tubeDataLayer = Object.create(DataLayer);
