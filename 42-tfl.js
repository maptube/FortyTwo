/**
* TfL data layers - tube and bus
*
*/

var TubeDataLayer = {
	bbox : null,						//bounding box for data which is set when it is loaded - this comes from the collada line network only
	//tube_network : null, 				//holds origin/destination links for tube network
	//tube_stationcodes : new Array(), 	//station lat/lon lookup from 3 letter code
	//tube_data : new Array(), 			//latest data download - this is what we're interpolating away from
	//tube_data_time : null, 				//this is the time that tube_data is valid for
	mesh_tubeLines : null,				//this is the mesh showing the position of the lines
	
	agentsHelper : Object.create(AgentsHelper),	//trying to make an abstraction of the agent animation to make the buses work

	//constants defining where some of the data comes from
	urlTubeNetworkJSON : 'realtime/tube-network.json',
	urlStationCodesCSV : 'data/station-codes.csv',
	urlTubeLinesDAE : 'data/TubeLines_thin_ECEF.DAE',
	urlTubeLinesOBJ : 'data/TubeSplines_ECEF.obj',
	urlRealTimeTubes : 'http://loggerhead.casa.ucl.ac.uk/api.svc/f/trackernet?pattern=trackernet_*.csv',

	/**
	* Second animate function using the helper
	*/
	animate : function (earth) {
		//old if (this.tube_data_time==null) return; //not loaded yet...
		//old if (this.tube_network==null) return;
		if (this.agentsHelper.dataTime==null) return; //not loaded yet...
		if (this.agentsHelper.odNetwork==null) return;
		//var delta = clock.getDelta();
		var now = new Date();
		this.agentsHelper.animate(now);
		var inner_parent = this; //needed as traverse changes scope to window
		earth.traverse(function (child) {
			var anim_rec = null;
			if (child.name) anim_rec=inner_parent.agentsHelper.agents[child.name];
			if (anim_rec!=null) {
				child.position.x=(anim_rec.position.x)/1000;
				child.position.y=(anim_rec.position.y)/1000;
				child.position.z=(anim_rec.position.z)/1000;
				child.lookAt(anim_rec.forward.multiplyScalar(1/1000)); //align cube towards destination station (does this modify anim_rec?)
			}
		});
	},
	
	/**
	* Animate tube trains using the network data and current position
	*/
	//animate_old : function (earth) {
	//	if (this.tube_data_time==null) return; //not loaded yet...
	//	if (this.tube_network==null) return;
	//	//var delta = clock.getDelta();
	//	var now = new Date();
	//	var elapsedSecs = (now-this.tube_data_time)/1000; //between data time and now
	//	//scene.traverse...
	//	var inner_parent = this; //needed as traverse changes scope to window
	//	earth.traverse(function (child) {
	//		var anim_rec = null;
	//		if (child.name) anim_rec=inner_parent.tube_data[child.name];
	//		if (anim_rec!=null) {
	//			var d = anim_rec.timeToStation-elapsedSecs;
	//			var lineCode = child.name[0]; //first letter of name is the line code
	//			var lineRoutes = inner_parent.tube_network[lineCode];
	//			if (lineRoutes==null) return; //exit early as this signals data not fully loaded asynchronously
	//			
	//			var route = lineRoutes[anim_rec.platformCode]; //0 or 1 representing up or down direction
	//			if (d<0) {
	//				//Already got to next station and gone beyond, so extrapolate position based on next station along route.
	//				//Essentially, write a new anim record based on the tube following the runlink exactly.
	//				//TODO: this isn't going to work if there is a choice of next station at a branch. For this you need to use
	//				//the destination.
	//				//FIX: TODO: if there is a choice, you could just sit at the station and wait rather than make a wrong guess?
	//				for (i in route) {
	//					var runlink=route[i];
	//					if (runlink.o==anim_rec.stationCode) { //find a runlink originating at the station we've just reached in dir we're going
	//						anim_rec.stationCode=runlink.d;
	//						anim_rec.timeToStation=d+runlink.r+elapsedSecs; //calculated from d+= below and var d= line above
	//						d+=runlink.r; //move d along this runlink by its negative amount
	//						break;
	//					}
	//				}
	//			}
	//			//rest of code
	//			if (d>0) { //i.e. we haven't got to the next station yet
	//				//console.log("d="+d);
	//				//get the relevant runlink
	//				for (i in route) {
	//					var runlink=route[i];
	//					if (runlink.d==anim_rec.stationCode) { //check destination station for direction we're going in
	//						//console.log(runlink);
	//						//do the new position calculation here
	//						var fromStation = inner_parent.tube_stationcodes[runlink.o];
	//						var toStation = inner_parent.tube_stationcodes[runlink.d];
	//						var lambda = (runlink.r-d)/runlink.r;
	//						//console.log(lambda);
	//						if (lambda<0) lambda=0; //math.min!
	//						if (lambda>1) lambda=1; //shouldn't happen
	//						//technically, this is spherical, not linear
	//						//var dlon=toStation.lon-fromStation.lon, dlat=toStation.lat-fromStation.lat;
	//						//var lon=fromStation.lon+lambda*dlon, lat=fromStation.lat+lambda*dlat;
	//						var p1 = convertCoords(fromStation.lon,fromStation.lat,0); //height=0 above earth
	//						var p2 = convertCoords(toStation.lon,toStation.lat,0);
	//						var ox=child.position.x, oy=child.position.y, oz=child.position.z;
	//						child.position.x=(p1.x+lambda*(p2.x-p1.x))/1000;
	//						child.position.y=(p1.y+lambda*(p2.y-p1.y))/1000;
	//						child.position.z=(p1.z+lambda*(p2.z-p1.z))/1000;
	//						//var vec = new THREE.Vector3();
	//						//vec.x=p2.x/1000; vec.y=p2.y/1000; vec.z=p2.z/1000;
	//						//careful with this as it modifies p2 i.e. don't use p2 again!
	//						child.lookAt(p2.multiplyScalar(1/1000)); //align cube towards destination station
	//						
	//						//child.calculateBoundingBox();
	//						//child.geometry.verticesNeedUpdate = true;
	//						//child.geometry.normalsNeedUpdate = true;
	//						//child.geometry.elementsNeedUpdate = true;
	//						//child.geometry.buffersNeedUpdate = true;
	//						//child.geometry.computeBoundingBox();
	//						//child.geometry.computeBoundingSphere();
	//						//console.log(d,lambda,runlink,ox,oy,oz,p1,p2,child.position.x,child.position.y,child.position.z);
	//						//update?
	//						//child.verticesNeedUpdate = true;
	//						break;
	//					}
	//				}
	//			}
	//			else {} //stop animating as we're past the next station and need the graph to find out where to go next
	//		}
	//	});
	//},


	/**
	* Get colour for a tube line from the line code character
	*/
	lineCodeToColour : function(c) {
		var lineBColour = 0xb06110,
			lineCColour = 0xef2e24,
			lineDColour = 0x008640,
			lineHColour = 0xffd203, //this is yellow!
			lineJColour = 0x959ca2,
			lineMColour = 0x98005d,
			lineNColour = 0x231f20,
			linePColour = 0x1c3f95,
			lineVColour = 0x009ddc,
			lineWColour = 0x86cebc;
			//lineY colour?
		switch (c) {
			case 'B': return lineBColour; //Bakerloo
			case 'C': return lineCColour; //Central
			case 'D': return lineDColour; //District
			case 'H': return lineHColour; //Hammersmith and City and Circle
			case 'J': return lineJColour; //Jubilee
			case 'M': return lineMColour; //Metropolitan
			case 'N': return lineNColour; //Northern
			case 'P': return linePColour; //Piccadilly
			case 'V': return lineVColour; //Victoria
			case "W": return lineWColour; //Waterloo and City
			default: return 0xffffff; //white
		}
	},
	
	/**
	* This is the main load function which loads the tube network and the realtime positions
	*/
	load : function (earth,ondataloaded) {
		this.loadnetwork();
		this.loadtubelinesmesh(earth,ondataloaded);
		//this.loadtubelinesmeshOBJ(earth,ondataloaded); //OBJ can't load lines in THREE.JS!
		this.loadtubes(earth);
	},
	
	/**
	* Load tube network data for the origin destination links of the network and the station locations that the nodes represent
	*
	*/
	loadnetwork : function () {
		//had to use closures to get the object data to the xmlhttp request complete event
		$.getJSON(this.urlTubeNetworkJSON,
			function (inner_parent) {
				return function(json) {
					//old inner_parent.tube_network = json;
					inner_parent.agentsHelper.setODNetwork(json);
				}
			}(this)
		);
		//load tube station data
		$.get(this.urlStationCodesCSV,
			function(inner_parent) {
				return function(csv) {
					var data = $.csv2Array(csv);
					for (var i = 1; i < data.length; i++) { //skip header line
						var stn = data[i][0], lon = data[i][3], lat = data[i][4];
						lat = parseFloat(lat);
						lon = parseFloat(lon);
						//old inner_parent.tube_stationcodes[stn]={ 'lat': lat, 'lon': lon };
						var p1 = convertCoords(lon,lat,0); //height=0 above earth
						inner_parent.agentsHelper.vertexList[stn]={ 'x': p1.x, 'y': p1.y, 'z': p1.z};
					}
				}
			}(this)
		);
	},
	
	

	/**
	* Load the mesh that represents the tube lines visually. This comes from a collada file (DAE), but all the colours and materials have to be reset.
	*
	* @param earth The object representing the earth, which we add the data to as a child
	* @param ondataloaded Callback which is called once the data has loaded asynchronously. Centres the camera to include the new data in the viewport.
	*/
	loadtubelinesmesh : function(earth,ondataloaded) {
		var loader = new THREE.ColladaLoader();
		//loader.options.convertUpAxis = false; //does nothing?
		loader.load(this.urlTubeLinesDAE,
			function(inner_parent) { //need to use closure to allow collada load event access to "this" object
				return function colladaReady( collada ) {
					//console.log(collada);
					//NOTE: getChildByName is returning a mesh, not a geometry!
					//	geometry = collada.scene.getChildByName('Cube', true).geometry; //scene.children[0]
			
					//for some reason, adding collada.scene to the scene doesn't work (materials?), so
					//have to add each piece of geometry to an Object3D
					//inner_parent.bbox = null;
					inner_parent.mesh_tubeLines = new THREE.Object3D();
					for (var i in collada.scene.children) {
						//var mat = collada.dae.materials[i]; //what is this?
						//get the colour of the Phong material that's defined for the child mesh and extract
						//it to make a replacement simple material of the same diffuse colour that will
						//actually render correctly
						var mat = collada.scene.children[i].material;
						//console.log(mat);
						//var mat_simple = new THREE.MeshBasicMaterial( { color: mat.color, wireframe: false } );
						var mat_simple = new THREE.MeshLambertMaterial({color: mat.color, ambient: mat.color, reflectivity: 0.5, wireframe: false});
						//mat_simple.color = mat.color;
						var g = collada.scene.children[i].geometry;
						var mesh = new THREE.Mesh(g,mat_simple);
						inner_parent.mesh_tubeLines.add(mesh);
						//moved bounding box calculation down due to scaling issues i.e. it doesn't apply the scale to the box
						//if (inner_parent.bbox===null) inner_parent.bbox=mesh.geometry.boundingBox;
						//else inner_parent.bbox.union(mesh.geometry.boundingBox);
					}
					//mesh_tubeLines = collada.scene; //.children[1].geometry; //was 0
					//aircraftMesh.rotationAutoUpdate=true;
					//mesh_tubeLines.matrixAutoUpdate=false;
			
			
					//x is lon, y is lat and z=height
					//var g = new THREE.CubeGeometry( 200, 200, 200 );
					//var mat = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } );
					//mesh_tubeLines = new THREE.Mesh( g, mat );
					//49889.371094 -100.155922 39737.390625 (old)
					//-79.126503 49890.207031 39737.351563
					//mesh_tubeLines.position.x=79;
					//mesh_tubeLines.position.y=-4989.0;
					//mesh_tubeLines.position.z=-3973.7; //+700;
					inner_parent.mesh_tubeLines.scale.x = inner_parent.mesh_tubeLines.scale.y = inner_parent.mesh_tubeLines.scale.z = 0.1;
					inner_parent.mesh_tubeLines.updateMatrix();
					//calculate mesh bounding box and apply scale to the box manually as it doesn't get set from the scale matrix just set above
					inner_parent.bbox = getCompoundBoundingBox(inner_parent.mesh_tubeLines);
					inner_parent.bbox.min.multiplyScalar(0.1); //you can't scale the box directly, only the min and max vectors
					inner_parent.bbox.max.multiplyScalar(0.1);
					earth.add(inner_parent.mesh_tubeLines);
			
					//camera.lookAt(mesh_tubeLines);
					//rotate the earth so that the 52 degree line is directly in front of you
					//earth.rotation.x+=52.0/180.0*Math.PI;
					//earth.updateMatrix();
					if (ondataloaded) ondataloaded.call(); //report back that we've loaded the data
				}
			}(this)
		);
	},
	
	/**
	* Load the tube lines data (visual) from an obj file. This is really a copy of the static data version, but with custom materials.
	*/
	//loadtubelinesmeshOBJ : function(earth,ondataloaded) {
	//	var loader = new THREE.OBJLoader();
	//	loader.load(this.urlTubeLinesOBJ,
	//		function(inner_parent) { //need to use closure to allow obj load event access to "this" object
	//			return function (obj) {
	//				inner_parent.mesh_tubeLines = new THREE.Object3D(); //obj;
	//				obj.traverse( function ( child ) {
	//					if ( child instanceof THREE.Mesh ) {
	//						//child.material.map = texture;
	//						var mat_simple = new THREE.MeshLambertMaterial({color: 0x000000, ambient: 0x000000, reflectivity: 0.5, wireframe: false});
	//						child.material = mat_simple;
	//						inner_parent.mesh_tubeLines.add(child);
	//					}
	//				} );
	//				//for (var i in obj.children) {
	//				//	var child = obj.children[i];
	//				//	//all names are of the format Line_V
	//				//	var mat_simple = new THREE.MeshLambertMaterial({color: 0x000000, ambient: 0x000000, reflectivity: 0.5, wireframe: false});
	//				//	child.material = mat_simple;
	//				//	var g = child.mesh.geometry;
	//				//	var mesh = new THREE.Mesh(g,mat_simple);
	//				//	mesh.name=child.name;
	//				//	inner_parent.mesh_tubeLines.add(mesh);
	//				//}
	//				inner_parent.mesh_tubeLines.scale.x = inner_parent.mesh_tubeLines.scale.y = inner_parent.mesh_tubeLines.scale.z = 0.1;
	//				earth.add(inner_parent.mesh_tubeLines);
	//		
	//				if (ondataloaded) ondataloaded.call(); //report back that we've loaded the data
	//			}
	//		}(this)
	//	);
	//},
	
	/**
	* Load data for realtime tube positions
	* Victoria 2009 stock is 8 cars, 133.28m long, 2.68m wide and 2.88m high
	*
	* @param earth The object representing the earth that we're going to add the tubes to as children
	*/
	loadtubes : function (earth) {
		//linecode,tripnumber,setnumber,lat,lon,east,north,timetostation(secs),location,stationcode,stationname,platform,destination,destinationcode
		//old this.tube_data_time = new Date(); //HACK! assume data is for now, not archive data
		this.agentsHelper.setDataTime(new Date()); //HACK! assume data is for now, not archive data
		//old this.tube_data = new Array();
		$.get(this.urlRealTimeTubes,
			function(inner_parent) {
				return function (csv) { //latest data
					var data = $.csv2Array(csv);
					for (var i = 1; i < data.length; i++) { //skip header line
						var lineCode = data[i][0], tripNum = data[i][1], setNum = data[i][2], lat = data[i][3], lon = data[i][4];
						if ((lat != "NaN") && (lon != "NaN")) {
							var timeToStation = parseInt(data[i][7]), stationCode = data[i][9], platform = data[i][11], platformCode = data[i][12];
							var lineColour = inner_parent.lineCodeToColour(lineCode);
							lat = parseFloat(lat);
							lon = parseFloat(lon);
							//tube size is world coords i.e. metres*1000
							var tube_cube = new THREE.Mesh(
								new THREE.CubeGeometry(0.02,0.02,0.1/*2.68/1000,2.88/1000,133.28/1000*/), //whl
								new THREE.MeshBasicMaterial( { color: lineColour, wireframe: false } )
							);
							tube_cube.name=lineCode+"_"+tripNum+"_"+setNum;
							var p3d = convertCoords(lon,lat,0);
							tube_cube.position.x=p3d.x/1000.0;
							tube_cube.position.y=p3d.y/1000.0;
							tube_cube.position.z=p3d.z/1000.0;
							tube_cube.updateMatrix();
							earth.add(tube_cube);
							//tube_cube.add(new THREE.Axes()); //doesn't work
							//now add a separate data record for animation
							//old
							//inner_parent.tube_data[lineCode+"_"+tripNum+"_"+setNum] = {
							//	'lat' : lat,
							//	'lon' : lon,
							//	'timeToStation' : timeToStation,
							//	'stationCode' : stationCode,
							//	'platform' : platform,
							//	'platformCode' : platformCode
							//};
							/////////////////////ADD ANIM HELPER REC
							inner_parent.agentsHelper.agents[lineCode+"_"+tripNum+"_"+setNum] = {
								'name' : lineCode+"_"+tripNum+"_"+setNum,
								'routeCode' : lineCode,
								'platform' : platform,
								'directionCode' : platformCode,
								'stationCode' : stationCode,
								'timeToStation' : timeToStation,
								'forward' : new THREE.Vector3(),
								'position' : p3d
							};
						}
					}
					//DEBUG_addBoundingBox(tubesO3D);
				}
			}(this)
		);
	}
}
//End of TubeDataLayer


//////////////////////////////////////////////////
//buses
//TODO: make a separate layer for the river services

var BusDataLayer = {

	bbox : null,
	busParent : null, //object that is the parent to all the bus cubes
	agentsHelper : Object.create(AgentsHelper), //used to animate the buses
	
	urlRealTimeBuses : 'realtime/countdown_20130418_135400.csv',
	//urlStopCodesJSON : 'realtime/countdown/stops.json',
	urlStopCodesJSON : 'realtime/countdown/stops_json.csv', //have to do this as it's not valid json
	
	cubeGeom : [
		[ -0.01, -0.01, -0.01 ],
		[ -0.01, -0.01,  0.01 ],
		[  0.01, -0.01,  0.01 ],
		[  0.01, -0.01, -0.01 ],
		[ -0.01,  0.01, -0.01 ],
		[ -0.01,  0.01,  0.01 ],
		[  0.01,  0.01,  0.01 ],
		[  0.01,  0.01, -0.01 ]
	],
	
	/**
	* Load bus positions from countdown csv datafile
	* The new RouteMaster is 11.23m long, 2.52m wide and 4.39m high according to Wikipedia
	*/
	busColour : 0xdc241f, //can you believe there is a TfL colour document defining this?
	
	animate : function (earth) {
		if (this.agentsHelper.dataTime==null) return; //not loaded yet...
		//if (this.agentsHelper.odNetwork==null) return;
		if (this.agentsHelper.vertexList==null) return;
		if ((this.busParent)&&(this.busParent.children.length>0)) { //first child of Object3D is a mesh
			var geom = this.busParent.children[0].geometry;
			var now = new Date();
			this.agentsHelper.simpleAnimate(now);
			//now need to go through all the agents and move the points in the mesh
			for (var i in this.agentsHelper.agents) {
				var anim_rec = this.agentsHelper.agents[i];
				var vindex = anim_rec.vindex;
				for (var p=0; p<8; p++) {
					geom.vertices[vindex+p].x=this.cubeGeom[p][0]+anim_rec.position.x/1000.0;
					geom.vertices[vindex+p].y=this.cubeGeom[p][1]+anim_rec.position.y/1000.0;
					geom.vertices[vindex+p].z=this.cubeGeom[p][2]+anim_rec.position.z/1000.0;
					//how are you going to spin it?
					//child.lookAt(anim_rec.forward.multiplyScalar(1/1000));
				}
			}
		
			//remember to signal geometry changed
			geom.verticesNeedUpdate = true;
			geom.normalsNeedUpdate = true;
			geom.elementsNeedUpdate = true;
			geom.buffersNeedUpdate = true;
			//geom.computeBoundingBox(); //frame-rate picks up if you omit this (slight bad)
			//geom.computeBoundingSphere();
		}
	},
	
	load : function (earth,ondataloaded) {
		this.loadNetwork();
		
		this.agentsHelper.setDataTime(new Date()); //HACK! assume data is for now, not archive data
		//route,destination,vehicleid,registration,tripid,lat,lon,east,north,bearing,expectedtime(utc),timetostation(secs),linkruntime,detailsstopcode,fromstopcode,tostopcode
		$.get(this.urlRealTimeBuses,
			function(inner_parent) {
				return function (csv) {
					inner_parent.busParent = new THREE.Object3D();
					var geom = new THREE.Geometry();
					var v_count=0;
					inner_parent.bbox = null;
					var data = $.csv2Array(csv);
					for (var i = 1; i < data.length; i++) { //skip header line
						var lat = data[i][5], lon = data[i][6], bearing = parseFloat(data[i][9]);
						var reg_no = data[i][3]; //unique ID
						var route = data[i][0]; //bus number (check this?)
						var timeToStation = parseFloat(data[i][11]);
						var runlink = parseInt(data[i][12]);
						var fromStation = data[i][14];
						var toStation = data[i][15];
						if ((data[i].length>=10) && (lat != "NaN") && (lon != "NaN")) {
							lat = parseFloat(lat);
							lon = parseFloat(lon);
							//bus size is world coords i.e. metres*1000
							//var bus_cube = new THREE.Mesh(
							//	new THREE.CubeGeometry(0.02,0.02,0.02/*2.52/1000,4.39/1000,11.23/1000*/), //whl
							//	new THREE.MeshBasicMaterial( { color: inner_parent.busColour, wireframe: false } )
							//	//new THREE.MeshLambertMaterial({color: inner_parent.busColour, ambient: inner_parent.busColour, reflectivity: 0.5, wireframe: false})
							//);
							//var p3d = convertCoords(lon,lat,0);
							//bus_cube.position.x=p3d.x/1000.0;
							//bus_cube.position.y=p3d.y/1000.0;
							//bus_cube.position.z=p3d.z/1000.0;
							//bus_cube.updateMatrix();
							//bus_cube.geometry.computeBoundingBox();
							//inner_parent.busParent.add(bus_cube);
							
							//new code - everything is a single geometry - could really do this with arrays
							var p3d = convertCoords(lon,lat,0);
							var x=p3d.x/1000.0,y=p3d.y/1000.0,z=p3d.z/1000.0;
							var v0=new THREE.Vector3(x-0.01,y-0.01,z-0.01);
							var v1=new THREE.Vector3(x-0.01,y-0.01,z+0.01);
							var v2=new THREE.Vector3(x+0.01,y-0.01,z+0.01);
							var v3=new THREE.Vector3(x+0.01,y-0.01,z-0.01);
							var v4=new THREE.Vector3(x-0.01,y+0.01,z-0.01);
							var v5=new THREE.Vector3(x-0.01,y+0.01,z+0.01);
							var v6=new THREE.Vector3(x+0.01,y+0.01,z+0.01);
							var v7=new THREE.Vector3(x+0.01,y+0.01,z-0.01);
							geom.vertices.push(v0);
							geom.vertices.push(v1);
							geom.vertices.push(v2);
							geom.vertices.push(v3);
							geom.vertices.push(v4);
							geom.vertices.push(v5);
							geom.vertices.push(v6);
							geom.vertices.push(v7);
							geom.faces.push(new THREE.Face3(v_count,v_count+4,v_count+7));
							geom.faces.push(new THREE.Face3(v_count,v_count+7,v_count+3));
							geom.faces.push(new THREE.Face3(v_count+1,v_count+5,v_count+4));
							geom.faces.push(new THREE.Face3(v_count+1,v_count+4,v_count+0));
							geom.faces.push(new THREE.Face3(v_count+2,v_count+6,v_count+5));
							geom.faces.push(new THREE.Face3(v_count+2,v_count+5,v_count+1));
							geom.faces.push(new THREE.Face3(v_count+3,v_count+7,v_count+6));
							geom.faces.push(new THREE.Face3(v_count+3,v_count+6,v_count+2));
							geom.faces.push(new THREE.Face3(v_count+4,v_count+5,v_count+6));
							geom.faces.push(new THREE.Face3(v_count+4,v_count+6,v_count+7));
							inner_parent.agentsHelper.agents[reg_no] = {
								'name' : reg_no,
								'routeCode' : route,
								'platform' : '',
								'directionCode' : bearing,
								//'stationCode' : stationCode,
								'timeToStation' : timeToStation,
								'forward' : new THREE.Vector3(),
								'position' : p3d,
								'vindex' : v_count,	//add this as needed to move points in mesh
								'fromStation' : fromStation,
								'toStation' : toStation,
								'runlink' : runlink
							};
							v_count+=8;
							
							//removed this for compound geom
							//I need to set the bbox from the centre point like this, as getCompoundBoundingBox doesn't seem to add the centres (i.e. it's always [0.1,0.1,0.1] [-0.1,-0.1,-0.1]) - why?
							//if (inner_parent.bbox===null) {
							//	inner_parent.bbox = new THREE.Box3(bus_cube.position,bus_cube.position);
							//}
							//else {
							//	inner_parent.bbox.expandByPoint(bus_cube.position);
							//}
						}
					}
					geom.computeFaceNormals();
					inner_parent.busParent.add(
						new THREE.Mesh(
							geom,
							//new THREE.MeshBasicMaterial( { color: inner_parent.busColour, wireframe: false }
							new THREE.MeshLambertMaterial( {color: inner_parent.busColour, ambient: inner_parent.busColour, reflectivity: 0.65, wireframe: false }
							)
						)
					);
					earth.add(inner_parent.busParent);
					//DEBUG_addBoundingBox(busesO3D);
					
					//siwtched back to this for comund geom
					inner_parent.bbox = getCompoundBoundingBox(inner_parent.busParent); //this doesn't work (see above)
					//console.log("bus",inner_parent.bbox);
					if (ondataloaded) ondataloaded.call(); //report back that we've loaded the data
				}
			}(this)
		);
	},
	
	/**
	* Load bus network data for the origin destination links of the network and the stop locations that the nodes represent
	* Actually, only loading the vertex list for now
	*/
	loadNetwork : function () {
		//had to use closures to get the object data to the xmlhttp request complete event
		//$.getJSON(this.urlTubeNetworkJSON,
		//	function (inner_parent) {
		//		return function(json) {
		//			//old inner_parent.tube_network = json;
		//			inner_parent.agentsHelper.setODNetwork(json);
		//		}
		//	}(this)
		//);
		//load bus stop data
		//TODO: here.....
		//need to convert stop codes json data into vertex list used by agents helper vertex list
		//This isn't strictly correct JSON as each line is an array and it's missing the commas.
		//Load as CSV although it's calling itself JSON.
		//[0,"Gospel Oak Station","34506","72579","490001119W","STBC",242,"GP",0,51.55475,-0.151763]
		//34506 is StopID, 72579 is StopCode1, 490001119W is StopCode2 - which do they use? StopID.
		$.get(this.urlStopCodesJSON,
			function(inner_parent) {
				return function(csv) {
					var data = $.csv2Array(csv);
					for (var i = 1; i < data.length; i++) { //skip header line [4,"1.0",1366642383630]
						var stn = data[i][2], lon = data[i][10], lat = data[i][9];
						lat = parseFloat(lat);
						lon = parseFloat(lon); //this will still have the ] on the end
						var p1 = convertCoords(lon,lat,0); //height=0 above earth
						inner_parent.agentsHelper.vertexList[stn]={ 'x': p1.x, 'y': p1.y, 'z': p1.z};
					}
				}
			}(this)
		);
	}

}

//End of bus data layer