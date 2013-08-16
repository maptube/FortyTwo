/**
* Agent animation class
*
*/

/**
* Animation record for a single agent
*
*/
var AnimRec = {
	name : "",
	routeCode : "",
	directionCode : null, //signifies which way we are travelling (Tube=platformCode=0|1, bus=null as direction routes are unique)
	stationCode : null,
	timeToStation : null,
	forward : new THREE.Vector3(),
	position : new THREE.Vector3()
}

var AgentsHelper = {
	dataTime : new Date(), //validity time of the data
	agents : new Array(), //list of animrecs
	vertexList : new Array(), //list of vertex names and xyz positions
	odNetwork : new Object(), //origin destination network - loaded from JSON asynchronously
	
	//setup : function () {
	//},
	
	/**
	* Set the validity time of the current data (anim_recs) so we can interpolate into the future using the system time.
	* Need to do it this way to keep within prototype of AgentsHelper object
	*/
	setDataTime : function (dt) {
		this.dataTime.setTime(dt.getTime()); //not exactly intuitive, but sets date AND time (also recommended to use valueOf)
	},
	
	/**
	* Setter function for Origin Destination network links
	*
	*/
	setODNetwork : function (odlinks) {
		//Need to do it this way to keep the odNetwork within the prototype AgentsHelper object
		//JS object merge
		for (var attrname in odlinks) { this.odNetwork[attrname] = odlinks[attrname]; }
	},
	
	/**
	* animate
	* Update the anim_rec data with new positions
	* @param nowTime The current time now (so probably "new Date()" unless it's archive data)
	*/
	animate : function (nowTime) {
		//var now = new Date();
		var elapsedSecs = (nowTime-this.dataTime)/1000; //between data time and now
		for (var i in this.agents) { //i is actually the name of the agent, not an index number
			var anim_rec = this.agents[i];
			if (anim_rec!=null) {
				var d = anim_rec.timeToStation-elapsedSecs;
				var routeCode = anim_rec.routeCode; //identifies route in od network data
				var lineRoutes = this.odNetwork[routeCode];
				if (lineRoutes==null) return; //exit early as this signals data not fully loaded asynchronously
				var route = lineRoutes[anim_rec.directionCode]; //0 or 1 representing up or down direction
				if (d<0) {
					//Already got to next station and gone beyond, so extrapolate position based on next station along route.
					//Essentially, write a new anim record based on the tube following the runlink exactly.
					//TODO: this isn't going to work if there is a choice of next station at a branch. For this you need to use
					//the destination.
					//FIX: TODO: if there is a choice, you could just sit at the station and wait rather than make a wrong guess?
					for (i in route) {
						var runlink=route[i];
						if (runlink.o==anim_rec.stationCode) { //find a runlink originating at the station we've just reached in dir we're going
							anim_rec.stationCode=runlink.d;
							anim_rec.timeToStation=d+runlink.r+elapsedSecs; //calculated from d+= below and var d= line above
							d+=runlink.r; //move d along this runlink by its negative amount
							break;
						}
					}
				}
				//rest of code
				if (d>0) { //i.e. we haven't got to the next station yet
					//console.log("d="+d);
					//get the relevant runlink
					for (i in route) {
						var runlink=route[i];
						if (runlink.d==anim_rec.stationCode) { //check destination station for direction we're going in
							//console.log(runlink);
							//do the new position calculation here
							var fromStation = this.vertexList[runlink.o];
							var toStation = this.vertexList[runlink.d];
							var lambda = (runlink.r-d)/runlink.r;
							//console.log(lambda);
							if (lambda<0) lambda=0; //math.min!
							if (lambda>1) lambda=1; //shouldn't happen
							//technically, this is spherical, not linear
							var p1=fromStation;
							var p2=toStation;
							anim_rec.position.x=(p1.x+lambda*(p2.x-p1.x));
							anim_rec.position.y=(p1.y+lambda*(p2.y-p1.y));
							anim_rec.position.z=(p1.z+lambda*(p2.z-p1.z));
							anim_rec.forward.x=p2.x; anim_rec.forward.y=p2.y; anim_rec.forward.z=p2.z; //this is the point we're moving towards, so do a child.lookAt to orient the real object
							break;
						}
					}
				}
				else {} //stop animating as we're past the next station and need the graph to find out where to go next
			}
		}
	}
}