/**
* Met Office Data Point layer
*
*/

var MetoDataPointLayer = {
	bbox : null,						//bounding box for data which is set when it is loaded - this comes from the collada line network only
	geomParent : null,
	
	//constants defining where some of the data comes from
	//urlRealTimeData : 'http://loggerhead.casa.ucl.ac.uk/api.svc/f/metodatapoint?pattern=metodatapoint_*.csv',
	urlRealTimeData : 'realtime/metodatapoint_20130731_120100.csv',
	
	/**
	* Animate data?
	*/
	animate : function (earth) {
	},
	
	/**
	* This is the main load function
	*/
	load : function (earth,ondataloaded) {
		//datetime_utc,wxtype,visibility,temperature,wind_speed,wind_direction,wind_gust,pressure,station_name,station_number,lat,lon,report_datetime_utc,datetime_local
		$.get(this.urlRealTimeData,
			function(inner_parent) {
				return function (csv) {
					inner_parent.geomParent = new THREE.Object3D();
					var geom = new THREE.Geometry();
					var v_count=0;
					inner_parent.bbox = null;
					var data = $.csv2Array(csv);
					for (var i = 1; i < data.length; i++) { //skip header line
						var lat = data[i][10], lon = data[i][11];
						if ((data[i].length>=11) && (lat != "NaN") && (lon != "NaN")) {
							lat = parseFloat(lat);
							lon = parseFloat(lon);
							
							var p3d = convertCoords(lon,lat,0);
							var x=p3d.x/1000.0,y=p3d.y/1000.0,z=p3d.z/1000.0;
							var v0=new THREE.Vector3(x-0.1,y-0.1,z-0.1);
							var v1=new THREE.Vector3(x-0.1,y-0.1,z+0.1);
							var v2=new THREE.Vector3(x+0.1,y-0.1,z+0.1);
							var v3=new THREE.Vector3(x+0.1,y-0.1,z-0.1);
							var v4=new THREE.Vector3(x-0.1,y+0.1,z-0.1);
							var v5=new THREE.Vector3(x-0.1,y+0.1,z+0.1);
							var v6=new THREE.Vector3(x+0.1,y+0.1,z+0.1);
							var v7=new THREE.Vector3(x+0.1,y+0.1,z-0.1);
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
							v_count+=8;
						}
					}
					geom.computeFaceNormals();
					inner_parent.geomParent.add(
						new THREE.Mesh(
							geom,
							new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false } )
						)
					);
					earth.add(inner_parent.geomParent);
					
					inner_parent.bbox = getCompoundBoundingBox(inner_parent.geomParent);
					console.log("wx bbox=",inner_parent.bbox);
					if (ondataloaded) ondataloaded.call(); //report back that we've loaded the data
				}
			}(this)
		);
	}
	
}
