/**
* Takes a GeoJSON array of array of points [ [x,y,x,y,...], [x,y,x,y,...], [x,y,x,y,...] ]
* and converts it into [ [Vector2,Vector2,...], [Vector2,Vector2,...], [Vector2,Vector2,...] ]
* so that the rings can be passed to THREE.JS to make shapes.
*/
function makeVectorRings(linearRings) {
	//guard against zero rings? - it's illegal
	var v_rings = [];
	$.each(linearRings, function(i,ring) {
		var v_ring = [];
		$.each(ring, function(i,coord) {
			v_ring.push(new THREE.Vector2(coord[0],coord[1]));
		});
		//push ring coords backwards
		//for (var j=ring.length-1; j>=0; j--) {
		//	v_ring.push(new THREE.Vector2(ring[j][0],ring[j][1]));
		//}
		v_rings.push(v_ring);
	});
	return v_rings;
}

/**
* A polygon is an array of linear rings where the first ring is the exterior ring and all following
* rings are interior rings (holes).
* @param linearRings
* @returns A THREE.JS geometry, extruded 20 units, but still in lat/lon coords
*/
function parsePolygon(linearRings) {
	var geom = null;
	var v_rings = makeVectorRings(linearRings); //turn coords into vectors
	
	//var shape = new THREE.Shape(v_rings[0]);
	//shape.autoClose=true;
	//if (v_rings.length > 1) {
	//	shape.holes = v_rings.slice(1).map(function(hole) { return new THREE.Shape(hole); });
	//}
	//if (v_rings.length>1) {
	//	for (var i=1; i<v_rings.length; i++) {
	//		var hole = new THREE.Shape(v_rings[i]);
	//		//hole.autoClose=true;
	//		shape.holes.push(hole);
	//	}
	//}
	
	//none of the THREE.JS triangulation routines seem to work on any real geographic data...
	//height is wrong! seems to do nothing 'amount'?
	//geom = new THREE.ExtrudeGeometry(shape, { amount: 100, bevelEnabled: false });
	//geom = shape.makeGeometry();
	
	//use poly2tri to do the triangulation see: http://threejsdoc.appspot.com/doc/three.js/src.source/extras/core/Shape.js.html
	//THREE.JS vector has x,y properties, so can be used with poly2tri
	var points = v_rings[0].slice(0); //shallow clone the points
	points.pop(); //pop off final closing point from end or outer shell
	var swctx = new poly2tri.SweepContext(points);
	//add holes, which get added on to the points array used to create the SweepContext
	for (var i=1; i<v_rings.length; i++) {
		v_rings[i].pop(); //remove duplicate end point
		swctx.AddHole(v_rings[i]);
	}
	try {
		poly2tri.sweep.Triangulate(swctx); //throws a collinear error for degenerates
		//now get the data out as a mesh
		var triangles = swctx.GetTriangles();
		var tr;
		geom = new THREE.Geometry();
		//and push the new geometry triangle by triangle
		for (var i in points) { //there's probably an easier way of doing this
			var x = points[i].x;
			var y = points[i].y;
			geom.vertices.push(new THREE.Vector3(x,y,0));
		}
		for (var t in triangles) {
			tr = triangles[t];
			var v1 = points.indexOf(tr.GetPoint(0));
			var v2 = points.indexOf(tr.GetPoint(1));
			var v3 = points.indexOf(tr.GetPoint(2));
			geom.faces.push(new THREE.Face3(v1,v2,v3));
		}
		geom.verticesNeedUpdate = true;
		geom.normalsNeedUpdate = true;
		geom.elementsNeedUpdate = true;
		geom.buffersNeedUpdate = true;
		geom.computeBoundingBox();
		geom.computeBoundingSphere();
		//geom.computeVertexNormals(); //crashes - are there no normals? do I have to create them?
		//geometry.computeCentroids();
		//geometry.computeFaceNormals();
		//console.log(geom);
	}
	catch (err) {
		console.log(err);
	} //probably a collinear error - can't do anything about that
	
	return geom;
}

/**
* Takes a GeoJSON geometry object and returns a THREE.JS mesh
* TODO: only handles polygon and multipolygon types at the moment
* @param geoJSON The features[i].geometry part of the GeoJSON FeatureCollection
* @param colour integer version of colour
*/
function parseGeometry(geoJSON,colour) {
	var object3D = new THREE.Object3D();
	switch (geoJSON.type) {
		case 'GeometryCollection':
			break;
		case 'Point' :
			break;
		case 'LineString' :
			break;
		case 'Polygon' :
			var geom = parsePolygon(geoJSON.coordinates);
			var mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial( { color: colour, wireframe: false } ) );
			object3D.add(mesh);
			break;
		case 'MultiPoint' :
			break;
		case 'MultiLineString' :
			break;
		case 'MultiPolygon':
			$.each(geoJSON.coordinates, function(i,poly) {
				var geom = parsePolygon(poly);
				if (geom!=null) {
					var mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial( { color: colour, wireframe: false } ) );
					object3D.add(mesh);
				}
			});
			break;
	}
	return object3D;
}

/**
* GeoJSON specification is here: http://www.geojson.org/
* GEOMETRY MUST BE IN WGS84 IN 2D
* This is due to the way that the outer ring and inner rings (holes) must be created, extruded
* and then projected onto a spherical Earth (actually spherical to Cartesian).
* The plane needs to be flat in order to load the complex geometry and be able to extrude it.
* An alternative would be to pre-compute the tesselation rather than using path geometry and load
* the object as a true 3D model rather than a 2D one, but this follows the recognised geospatial
* approach.
* Sets mesh_world when data has loaded and been parsed
* This is the root source of the THREE.JS triangulation code (C++)
* http://www.flipcode.com/archives/Efficient_Polygon_Triangulation.shtml
* @param url
* @param colour
* It's an async loading function, so it can't return anything. Meshes get added to the scene graph as they load.
*/
function loadGeoJSONWorld(url,colour) {
	//MUST ensure that polygons have no outer boundaries that are self-touching.
	//Used geotools to clean the geojson file first.

	//using jQuery JSON parsing
	//$.getJSON('data/TM_WORLD_BORDERS_SIMPL-0.3_WGS84.JSON', function(json) {
	//$.getJSON('data/UK_TM_WORLD_BORDERS_SIMPL-0.3_WGS84.JSON', function(json) {
	//$.getJSON('data/box_test.JSON', function(json) {
	//$.getJSON('data/CANADA_TM_WORLD_BORDERS_SIMPL-0.3_WGS84.JSON', function(json) {
	//$.getJSON('data/TM_WORLD_BORDERS_SIMPL-0.3_WGS84_QGIS.GEOJSON', function(json) {
	//$.getJSON('data/TM_WORLD_BORDERS_SIMPL-0.3_WGS84.GEOJSON', function(json) {
	$.getJSON(url, function(json) {
		//json.features is a list of feature objects which we need to parse
		var my_mesh_world = new THREE.Object3D();
		$.each(json.features, function(i, feature) {
			//"type" : "FeatureCollection",
			//"geometry" : { "type": "LineString", "coordinates": [ [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]]},
			//"properties" : { key/value pairs }
			var object3D = parseGeometry(feature.geometry,colour);
			if (object3D!=null) {
				//reproject object into Cartesian and add to composite object
				sphericalToCartesian(object3D);
				my_mesh_world.add(object3D);
			}
		});
		//mesh_world.verticesNeedUpdate = true;
		//mesh_world.normalsNeedUpdate = true;
		//mesh_world.elementsNeedUpdate = true;
		//mesh_world.buffersNeedUpdate = true;
		earth.add(my_mesh_world);
		
		//add a bounding cube marker so we know where geometry is
		DEBUG_addBoundingBox(my_mesh_world);
	});
}