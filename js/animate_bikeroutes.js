//Setup map and global variables
//change all

var ratio = window.devicePixelRatio;

mapboxgl.accessToken = 'pk.eyJ1IjoiYWNoYW1vMTgiLCJhIjoiY2xmOHB3cXM5MDFiaTNybG1qbndkd3dkcyJ9.hShPgU7zwqzWSbtcM5pIAg'
//mapboxgl.accessToken = 'pk.eyJ1IjoiYWNoYW1vcnJvIiwiYSI6ImNpcnFub3NuOTBodGtmZ204M2R2MmZobDIifQ.-eJXpRA44j_7MPBXg3z90A';
// mapboxgl.accessToken = 'pk.eyJ1IjoiYWNoYW1vcnJvIiwiYSI6ImNpcnFub3NuOTBodGtmZ204M2R2MmZobDIifQ.-eJXpRA44j_7MPBXg3z90A';
var light = 'mapbox://styles/mapbox/light-v9';
var map = new mapboxgl.Map({
    container: 'map',
    style: light,
    // style: 'mapbox://styles/achamorro/cj6llaoyo87772qp8y7u7h4wt',
    //style: 'mapbox://styles/achamorro/cj12lc6ww00462sqsg2q46c4s',
    center: [-77.033937, 38.902444],
    zoom: 12,
    interactive: false
});
map.scrollZoom.disable();
//map.addControl(new mapboxgl.NavigationControl());

// Setup our svg layer that we can manipulate with d3
var container = map.getCanvasContainer();
// var bbox = container.getBoundingClientRect();
var width = 1000;
var height = 600;

var canvas2 = d3.select(container).append("canvas").node();
canvas2.width = width;
canvas2.height = height;
var ctx2 = canvas2.getContext('2d');

var canvas = d3.select(container).append("canvas").node();
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext('2d');

function project(d) {
  return map.project(getLL(d));
}
function getLL(d) {
  return new mapboxgl.LngLat(+d[1], +d[0])
}

var linePathGenerator = d3.svg.line()
    .interpolate("monotone")
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; });

var line_projected = [];
var batch = 0;

var trips, subset, trips_mapped;
var animationDuration = 23;
var form = d3.time.format("%I %p");


//Load Data
queue()
  .defer(d3.json, "data/Oct1_Trips_1.json")
  .defer(d3.json, "data/Oct1_Trips_2.json")
  .await(combine);

function combine(error, trips1, trips2){
  if (error) {
      console.log(error);
  }
  trips = d3.merge([trips1, trips2]);
  //subset = processTrips(trips.slice(1,100));
  trips_mapped = processTrips(trips);
  vis();
}

function processTrips(data){

  getWaypoints = function(trip_coordinates){
    var line = turf.lineString(trip_coordinates);
    var options = {units: 'kilometers'};
    var length = turf.length(line, options);
    var waypoints_projected = [];
    for (var i=0; i<length; i = i + 0.05){
      var along = turf.along(line,i,options);
      waypoints_projected.push(project(along.geometry.coordinates))
    }
    return waypoints_projected;
  }

  var mapped = data.map(function(trip,i) {

    var format = d3.time.format("%m/%d/%y %H:%M");
    trip.route = trip[1];
    trip.start = format.parse(trip[2]);
    trip.hours = trip.start.getHours();
    //trip.minutes = trip.start.getMinutes();
    trip.minutesofday = trip.hours*60 + trip.start.getMinutes();
    trip.minutesofday_rescaled = +trip.hours;
    //trip.minutesofday_rescaled = +((trip.minutesofday*animationDuration)/1440).toFixed(0);
    trip.duration = trip[3];
    trip.waypoints_projected = getWaypoints(trip.route);

    return trip;
  });

  return d3.nest()
    .key(function(d){return d.minutesofday_rescaled})
    .entries(mapped);

}

function vis(){

function drawCircle(x,y){
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2, false);
  ctx.strokeStyle = 'white';
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = '#8A3232';
}

function drawCircle(x,y,xprev,yprev){
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2, false);
  ctx.strokeStyle = 'white';
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = '#8A3232';

  ctx2.beginPath();
  ctx2.moveTo(xprev,yprev);
  ctx2.lineTo(x,y);
  ctx2.strokeStyle = '#F2BEB3';
  ctx2.stroke();
  ctx2.globalAlpha = 0.01;
}

function draw(group){

  var t = 0;
  var maxwaypoints = +d3.mean(group.map(function(d){return d.waypoints_projected.length})).toFixed(0);
  animate();

  function animate(){
    if (t < maxwaypoints){requestAnimationFrame(animate); }
    //change hour
    if (t==maxwaypoints){requestBatch(batch);}
    ctx.clearRect(0,0,width,height);
    setCircles(group, t);
    //erase the last frame
    if (t==maxwaypoints) {ctx.clearRect(0,0,width,height);}
    t++;
  }

  function setCircles(group, j){
      group.forEach(function(trip){
        if(j<trip.waypoints_projected.length){
          if(j>0){
            drawCircle(trip.waypoints_projected[j].x, trip.waypoints_projected[j].y, trip.waypoints_projected[j-1].x, trip.waypoints_projected[j-1].y);
          }
          else {
            drawCircle(trip.waypoints_projected[j].x, trip.waypoints_projected[j].y);
          }
        }
      });
    }

}

var label = d3.select("#timelabel");

function requestBatch(group){
  if (batch<=animationDuration){
    draw(trips_mapped[group].values);
    label.text(form(trips_mapped[group].values[0]["start"]));
    batch++;
  }
}

function initiateAnimation() {

    requestBatch(batch);

};

  d3.select("#play").on("click", initiateAnimation);

};
