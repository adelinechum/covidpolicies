// Define margins
var margin = {top: 20, right: 80, bottom: 30, left: 50},
width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

// Define date parser
var parseDate = d3.time.format("%Y-%m-%d").parse;

// Define scales
var xScale = d3.time.scale().range([0, width]);
var yScale = d3.scale.linear().range([height, 0]);
var color = d3.scale.ordinal()
      // .range(["#808080"]);
      .range(["#F16745","#FFC65D","#7BC8A4","#4CC3D9","#93648D"," #404040"])
// .range(["#440154", "#482878", "#3e4989","#31688e", "#26828e","#1f9e89", "#35b779","#6ece58", "#b5de2b", "#fde725", "#fde725", "#fde725"]);

// Define axes
var xAxis = d3.svg.axis().scale(xScale).orient("bottom");
var yAxis = d3.svg.axis().scale(yScale).orient("left");

// Define lines
var line = d3.svg.line().interpolate("basis")
            .x(function(d) { return xScale(d["date"]); })
            .y(function(d) { return yScale(d["concentration"]); });

// Define svg canvas
var svg = d3.select("#chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var circle;

// Read in data
// d3.csv("giniLine.csv", function(error, data){
//   if (error) throw error;
d3.csv("data5.csv", function(error, data){
  if (error) throw error;

  var stateColumn = data.map(function(d) {
    return {
      state: d.state
    }
    });

    var stateKeys = {};
    stateColumn.forEach( function( item ) {
        var grade = stateKeys[item.state] = stateKeys[item.state] || {};
        grade[item.Domain] = true;
    });

    stateKeys = Object.keys(stateKeys)

    var pactColumn = data.map(function(d) {
      return {
        pact: d.Pact
      }
      });


    var pactKeys = {};
    pactColumn.forEach( function( item ) {
        var grade = pactKeys[item.pact] = pactKeys[item.pact] || {};
        grade[item.Domain] = true;
    });

    pactKeys = Object.keys(pactKeys);

  console.log(pactKeys);

  color.domain(pactKeys);

  // console.log(JSON.stringify(data, null, 2)) // to view the structure

  // Format the data field
  data.forEach(function(d){
    d["date"] = parseDate(d["date"])
  });

  // Filter the data to only include a single metric
  var subset = data.filter(function(el) {return el.metric === "CaseCapita" });
  // console.log(JSON.stringify(subset, null, 2))

  // Reformat data to make it more copasetic for d3
  // data = An array of objects
  // concentrations = An array of three objects, each of which contains an array of objects
// pact: data.filter(function(d){ return d.state == state })["pact"][0]

  // console.log(data.filter(function(d){ return d.state == "Washington" })[0].Pact)

  // TODO: find a better way to get pact

  var concentrations = stateKeys.map(function(state){
    return {state: state, pact: data.filter(function(d){ return d.state == state })[0].Pact,
    datapoints: data.filter(function(d){ return d.state == state }).map(function(d){
      return {date: d["date"], concentration: d["CaseCapita"], cases: d["cases"]}
    })}
  })


  console.log(JSON.stringify(concentrations, null, 2)) // to view the structure

  // Set the domain of the axes
  xScale.domain(d3.extent(data, function(d) {return d["date"]; }));

  yScale.domain([0, d3.max(data, function(d) { return +d.CaseCapita; })]);

  // Place the axes on the chart
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("class", "label")
      .attr("y", 6)
      .attr("dy", ".71em")
      .attr("dx", ".71em")
      .style("text-anchor", "beginning")
      .text("COVID Cases Per Capita");

  var products = svg.selectAll(".category")
        .data(concentrations)
        .enter().append("g")
        .attr("class", "category");

  products.append("path")
          .attr("class", "line")
          .attr("d", function(d) {return line(d.datapoints); })
          .style("stroke", function(d) {return color(d.pact); });

    // console.log(JSON.stringify(d3.values(concentrations), null, 2)) // to view the structure
    // console.log(d3.values(concentrations)); // to view the structure
    // console.log(concentrations);
    // console.log(concentrations.map(function()))
    // circle = d3.select("svg").append("circle").attr("id", "circlej").attr("cx", 25).attr("cy", 25).attr("r", 25).style("fill", "purple");

// why doesn't htis work when I take it out
    d3.selectAll(".line").on("mouseover", handleMouseOver).on("mouseout", handleMouseOut);
    // Create Event Handlers for mouse

    function getCasesByDate(date, d){
      for(var i = 0; i < d.length; i++){
        // need to make this more precise
        if(Math.abs(((d[i].date - date) / 3600000)) < 24)
        {
          // console.log(d[i].date - date)
          // console.log("searched date: " + date)
          // console.log("matched date: " + d[i].date);
          return d[i].cases;
        }
      }
    }

    function roundDate(timeStamp){
    timeStamp -= timeStamp % (24 * 60 * 60 * 1000);//subtract amount of time since midnight
    timeStamp += new Date().getTimezoneOffset() * 60 * 1000;//add on the timezone offset
    return new Date(timeStamp);
    }

    var tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    var formatTime = d3.time.format("%e %B");
    var formatNumbers = d3.format(",")
    var lineColor;

    function handleMouseOver(d, i) {  // Add interactivity
          lineColor = d3.select(this).style("stroke")
          d3.select(this).style("stroke-width", 5).style("stroke", "steelblue");
          console.log(d.state);
          var date = roundDate(xScale.invert(d3.event.pageX - margin.left));
          var cases = getCasesByDate(date, d.datapoints);

          tooltip.transition()
              .duration(200)
              .style("opacity", .9);
          tooltip.html(d.state + " (" + d.pact + ")" + "<br/>" + formatTime(date) + "<br/> cases: "  + formatNumbers(cases))
          .style("left", (d3.event.pageX + 5) + "px")
          .style("top", (d3.event.pageY - 60) + "px");
          // console.log(d3.event.pageX)

          }

    function handleMouseOut(){
      d3.select(this).style("stroke-width", 2).style("stroke", lineColor);
      tooltip.transition()
    .duration(500)
    .style("opacity", 0);
      // xScale.invert(d3.event.pageX - margin.left);

    };
});


// Create Event Handlers for mouse
function handleMouseOver() {  // Add interactivity
      console.log('mouse is over');
    };

function handleMouseOut(){
  console.log('mouse is out');
};

// Define responsive behavior
function resize() {

  var width = parseInt(d3.select("#chart").style("width")) - margin.left - margin.right,
  height = parseInt(d3.select("#chart").style("height")) - margin.top - margin.bottom;

  // Update the range of the scale with new width/height
  xScale.range([0, width]);
  yScale.range([height, 0]);

  // Update the axis and text with the new scale
  svg.select('.x.axis')
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.select('.y.axis')
    .call(yAxis);

  // Force D3 to recalculate and update the line
  svg.selectAll('.line')
    .attr("d", function(d) { return line(d.datapoints); });

  // Update the tick marks
  xAxis.ticks(Math.max(width/75, 2));
  yAxis.ticks(Math.max(height/50, 2));
  // circle.attr("cx", parseInt(d3.select("#chart").style("width")) - 50);
};

// Call the resize function whenever a resize event occurs
d3.select(window).on('resize', resize);

// Call the resize function
resize();


//tooltip exction



// j
