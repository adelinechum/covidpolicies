var data

const filteringState = {filterType: 'All'};

// main async function, used to wait for completion of asynch tasks
(async function() {
  google.charts.load('current');
  await setUpQuery('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=RAW_NYT_us-states',
'select *');
  var dataTable = await getQuery();
  data = createTrendingData(createTable(dataTable));

  initGraphs(data)

  update()

})();


// set up google visualization query
function setUpQuery(sheetLocation, queryStatement) {
   var promise = new Promise(function(resolve, reject) {
       google.charts.setOnLoadCallback(function(){
           query = new google.visualization.Query(sheetLocation);
           query.setQuery(queryStatement);
          resolve('done');
       }
);
   });
   return promise;
}

// send query and return the response
function getQuery(){
  var promise = new Promise(function(resolve, reject){
    query.send(function(response){
      resolve(response);
    })
  });
  return promise;
}

var sort;

// transform google response into an array
function createTable(response){
  var dataArray =[];
  var data = response.getDataTable();
  var columns = data.getNumberOfColumns();
  var rows = data.getNumberOfRows();
  var table = [];

  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < columns; c++) {
      row.push(data.getFormattedValue(r, c));
    }
    table.push(row)
  }

  return table;
}

//transform array of data into JSON
function createTrendingData(table){

    table = table.map(d =>
      { return {
        date: new Date(d[0]),
        state: d[1],
        fips: +d[2],
        cases: +d[3],
        deaths: +d[4],
        stateDate: d[5],
        population: +d[6],
        caseCapita: +d[7],
        pact: d[8],
        color: d[9],
        stayAtHomeRec: d[10]
      }}
    )

return table;

  }


  // Define scales
  var minDate, maxDate, margins, width, heigtht, xScale, yScale, color,
    enrichedData, line, svg, xAxis, yAxis

function initGraphs(data){
  width = 800;
  height = 600;
  margins = {left: 50, right: 50, top: 50, bottom: 50}
  minDate = new Date(2020, 03, 01)
  maxDate = new Date(2020,07, 31)


// define x-axis
  xScale = d3.scaleLinear()
    .domain([minDate, maxDate])
    .range([0, width])
    .clamp(true);

//define y-axis
  yExtent = d3.extent(data.map((d) => {
    return d.caseCapita
  }))

  yScale = d3.scaleLinear()
    .domain(yExtent)
    .range([height, 0])


  color = d3.scaleOrdinal()
    .range(["#D6156F","#0BD60F","#D69B15","#808080"])
    .domain(["Western", "Northeast", "Midwest", "N/A"])


  // TODO: move to a different function

    // get unique states
    var uniqueStates = Array.from(new Set(data.map((d) => {
      return d.state
    })))

    // uniqueStates = ["Alabama"]

    enrichedData = uniqueStates.map(state => {
      return {state: state, pact: data.filter(function(d){ return d.state == state })[0].pact,
      stayAtHomeRec: data.filter(function(d){ return d.state == state })[0].stayAtHomeRec,
      datapoints: data.filter(function(d){ return d.state == state }).map(function(d){
        return {date: d.date, concentration: d.caseCapita, cases: d.cases, deaths: d.deaths}
      })}
    })

    // filter out all #N/A states
    enrichedData = enrichedData.filter((state) => {
      return state.pact != "#N/A"
    })

    line = d3.line()
    .x(function(d){return xScale(d.date)})
    .y(function(d){return yScale(d.concentration)})
    .curve(d3.curveBasis);

    console.log(enrichedData);

    svg = d3.select("#chart")
                .attr("width", width + margins.left + margins.right)
                .attr("height", height + margins.top + margins.bottom)
                .append("g")
                .attr("id","canvas")
                .attr("transform", "translate(" + margins.left + "," + margins.top + ")");

                // Place the axes on the chart
    xAxis = svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0, " + (height) + ")")

    xAxis.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")));


    yAxis = svg.append("g")
      .attr("class", "y axis")
      // .attr("transform", "translate(" + margins.left + ", 0)")

    yAxis.call(d3.axisLeft(yScale).tickFormat(d3.format(",")))

}

var products

function functionName() {

}

//update data and draw lines on graph
function update() {

  // remove products if already populated
  if(products != null){products.remove()}

  //filter data
  var filteredData = filterBy(filteringState.filterType)

  products = svg.selectAll(".category")
        .data(filteredData)
        .enter().append("g")
        .attr("class", "category");

  products.append("path")
          .attr("class", "line")
          .attr("fill", "none")
          .style("stroke", "black")
          .attr("d", function(d) {return line(d.datapoints); })
          .style("stroke", function(d) {return color(d.pact); })
          .style("stroke-width", 2);

  d3.selectAll(".line").on("mouseover", handleMouseOver).on("mouseout", handleMouseOut)

}

// function to get the x and y coordinates of an element
// function getNodeCoordinate(selection) {
//   var selection = selection.node().getBoundingClientRect()
//   return{x: selection.x, y:selection.y}
// }

function getNodeCoordinate(el) {
    el = el.node()
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { y: rect.top + scrollTop, x: rect.left + scrollLeft }
}


var lineColor
var tooltip;
var formatTime = d3.timeFormat("%e %B")
var formatNumbers = d3.format(",")

function handleMouseOver(d, i) {  // Add interactivity
  lineColor = d3.select(this).style("stroke")
  d3.select(this).style("stroke-width", 5).style("stroke", "steelblue");

  var canvasNode = getNodeCoordinate(d3.select("#canvas"))
  var canvasOffsetX = canvasNode.x
  var canvasOffsetY = canvasNode.y
  var date = new Date(xScale.invert(d3.event.pageX
    - canvasOffsetX - margins.left))


  date = getClosestDate(d, date)

  var item = d.datapoints.find(e => {
    return e.date == date
  })


  tooltip = d3.select("#chart").append("svg")
    .attr("width", 100).attr("height", 67)
    .attr("x", (d3.event.pageX + 5 - canvasNode.x))
    .attr("y", (d3.event.pageY - 3) - canvasNode.y)
    .style("pointer-events", "none")

    console.log(canvasNode.y);

tooltip
  .append("rect")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .attr("width", "100%")
  .attr("height", "100%")
  .style("fill","white")
  .style("opacity", 0.5)
  .attr("stroke", "black")
  // .attr("stroke-width", 3)



  // tooltip.transition()
  //     .duration(200)
  //     .style("opacity", .9);
  // tooltip.html(d.state + " (" + d.pact + ")" + "<br/>" + formatTime(date) + "<br/> cases: "  + formatNumbers(cases))

  var text = tooltip.append("text")
  .attr("x", "0%")
  .attr("y", "0%")
  .attr("dominant-baseline", "middle")
  .attr("text-anchor", "middle")
  .attr('font-size', 10)

  text.append("tspan")
    .text(d.state)
    .attr("x", "50%")
    .attr("dy", "1.2em")

  text.append("tspan")
    .text(formatTime(date))
    .attr("x", "50%")
    .attr("dy", "1.2em")



  text.append("tspan")
    .text("Pact: " + d.pact)
    .attr("x", "50%")
    .attr("dy", "1.2em")

  text.append("tspan")
    .text("Cases: " + formatNumbers(item.cases))
    .attr("x", "50%")
    .attr("dy", "1.2em")

  text.append("tspan")
    .text("Deaths: " + formatNumbers(item.deaths))
    .attr("x", "50%")
    .attr("dy", "1.2em")


}

function setFilter(filterType) {
  filteringState.filterType = filterType;
  update();
}

function filterBy(filterType) {
  if(filterType == 'All') {return enrichedData}

  if(["Western", "Northeast", "Midwest", "N/A"].includes(filterType)){
    return enrichedData.filter(d => {
      return d.pact == filterType
    })
  }

  else if (["Yes", "NoMan", "NoManNoRec"].includes(filterType)) {
    return enrichedData.filter(d => {
      return d.stayAtHomeRec == filterType
    })
  }

}

function handleMouseOut(){
  d3.select(this).style("stroke-width", 2).style("stroke", lineColor);
  tooltip.remove()
}

// returns closest date to point clicked
function getClosestDate(d, date) {
  var distanceArray = []
  d.datapoints.forEach((d) => {
    distanceArray.push(Math.abs(d.date - date))
  });

  var index = distanceArray.findIndex((d) => {
    return d == d3.min(distanceArray)
  })

  return d.datapoints[index].date

}
