{
// global variables: data contains all graphing data,
// graphObject contains all variables needed by graphs,
// filtering state contains how the graphs are filtered
var data
var graphObject
var filteringState
var usData

// TODO: Make the graph data a global variable. otherwise, would have to be
// to too many functions because of update




// main async function, used to wait for completion of asynch tasks
(async function() {
  google.charts.load('current');
  var workbookName = 'https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet='

  var trendingData = await createDataFromQuery(workbookName +
    'RAW_NYT_us-states', 'select *', createTrendingData);

  var timelineData = await createDataFromQuery(workbookName + 'Timeline',
    'select A, B, C, D, E, F, G, H, I', createtimelineData);

  var governorData = await createDataFromQuery(workbookName + 'Main_Categories',
    'select A, N', createGovernorData);

  usData = await createDataFromQuery(workbookName + 'RAW_NYT_US',
    'select *', createUsData);

  // console.log(usData);

  data = combineData(trendingData, timelineData, governorData);

  graphObject = initGraphs(data)

// loop through each state and render data
  update(data);
})();

// update data and render
// TODO: refactor so that data doesn't have to be passed so often
function update(data) {

var data = filterBy(filteringState.filterType, sortBy(filteringState.sortType,data))

renderAll(data)

}

function setSort(sortType, data) {
  filteringState.sortType = sortType
  update(data)
}


function setPactFilter() {
  var selectBox = document.getElementById("pacts")
  var  value = selectBox.options[selectBox.selectedIndex].value
  filteringState.filterType = value

  update(data)
}

// function setPactFilter(filterType, data) {
//   filteringState.filterType = filterType
//   update(data)
// }


function sortBy(sortType, data) {
  switch (sortType) {
    case 'cases':
      data = data.sort(function(a,b){
        return b.currentCases - a.currentCases;
      })
      break;

    case 'deaths':
      data = data.sort(function(a,b){
        return b.currentDeaths - a.currentDeaths;
      })
      break;

    default:
    data = data.sort((a,b) =>a.state.localeCompare(b.state))

  }

return data;

}

function filterBy(filterType, data) {
  if(filterType == 'All') {return data}
  return data.filter(d => {
    return d.pact == filterType
  })
}


//create datasets from google sheet queries
async function createDataFromQuery(sheetLocation, queryStatement, transformFunction) {
  var promise = new Promise(async function (resolve, reject) {
    await setUpQuery(sheetLocation, queryStatement);
    var dataTable = await getQuery();
    resolve(transformFunction(createTable(dataTable)))
  });
  return promise;

  // helper function to set up google visualization query
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

  // helper function to send query and return the response
  function getQuery(){
    var promise = new Promise(function(resolve, reject){
      query.send(function(response){
        resolve(response);
      })
    });
    return promise;
  }

// helper function to transform google response into an array
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

}

// create json from array of data for trending data
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
      }}
    )

return table;

  }

// create json from array of data for time line data
function createtimelineData(table) {

      table = table.map(d =>
        { return {
          policy: d[0],
          start: new Date(d[1]),
          end: new Date(d[2]),
          start2: new Date(d[3]),
          end2: new Date(d[4]),
          state: d[5],
          color: d[6],
          pact: d[7],
          notes: d[8],
        }}
      )

  return table;
}

function createGovernorData(table) {

  table = table.map(d =>
    { return {
      state: d[0],
      governor: d[1]
    }}
  )

return table;
}

function createUsData(table){

    table = table.map(d =>
      { return {
        date: new Date(d[0]),
        state: d[1],
        cases: +d[3],
        deaths: +d[4],
        population: +d[6],
        caseCapita: +d[7],
      }}
    )

return table;

  }

// combine trending Data and timelineData into a single json
function combineData(trendingData, timelineData, governorData){

  var data = []
// sort timeline data alphabetically so it can be grouped correcly
  timelineData = timelineData.sort((a,b) =>a.state.localeCompare(b.state))

  for(var i = 0; i< timelineData.length; i = i + 9){

    var state = timelineData[i].state

    var casesData = trendingData.filter(d => {
      return d.state == state})

    var timeline = timelineData.slice(i, i + 9)

    data.push({

      state: state,
      // TODO: remove state, color, pact
      timeline: timeline,
      // TODO: remove state, stateDate and pact from casesData
      casesData: casesData,
      color: casesData[0].color,
      currentCases: d3.max(casesData.map(d => d.cases)),
      currentDeaths: d3.max(casesData.map(d => d.deaths)),
      governor: governorData.filter((d) => {
        return d.state == state})[0].governor,
      firstPolicy: d3.min(timeline.map(d => d.start)),
      pact: casesData[0].pact
    })
  }
  return data;
}

function renderAll(data) {
  d3.select("#fingerprint").selectAll("*").remove()

// TODO: add the loading bar

  data.forEach((state) => {
        renderData(state, createFingerprintContainer().append("svg"));
  });

// // TODO: renders out of order
  // d.forEach((state) => {
  //     setTimeout(function () {
  //       renderData(state, d3.select("#fingerprint").append("svg"));
  //     },0)
  // });
  // helper function to create container

// make containers with some padding for each graph
  function createFingerprintContainer() {
    return d3.select("#fingerprint")
      .append("div")
      .style("class","fingerprintContainer")
      .style("width","440px")
      .style("height","470px")
      .style("padding", "10px")
  }
}

// initalize variables used by all graphs
function initGraphs(data) {

  //graph dimensions
  graphDims = {top: 15, right: 0, bottom: 0, left: 60, width: 420, height: 450};

  scales = {
  // color scale for cases
    casesColor:  d3.scaleOrdinal()
                    .domain(['Republican','Swing','Democrat'])
                    .range(['#F03F4E','#A47AF0','#6292F0']),
  // color scale for timeline
    timelineColor: d3.scaleOrdinal()
                    .domain(['Republican','Swing','Democrat'])
                    .range(['#D60012','#4B00D6','#0047D6']),
  // color scale for death graph
    deathColor: d3.scaleOrdinal()
                    .domain(['Republican','Swing','Democrat'])
                    .range(['#570007','#1E0057','#001D57']),
  // y-axis for cases
    yCases: d3.scaleLinear()
                    .domain([0, .03])
                    .range([graphDims.height/3,0 + graphDims.top]),
  // y-axis for death graph
    yDeaths: d3.scaleLinear()
                    .domain([0, 32500])
                    .range([graphDims.height * 2/3,graphDims.height]),
    yTimeline: d3.scaleBand()
                    .domain(d3.range(data[0].timeline.length))
                    .range([graphDims.top + graphDims.height/3,
                      15 * data[0].timeline.length - graphDims.bottom
                      + graphDims.height/3]),
    x: null
  };

  // alternative maxDate based on last date in data
  // var maxDate = d3.max(timeLineArray.map(d => d.end));
  maxDate = new Date(2020,08,01);

  filteringState = {sortType: 'name', filterType: 'All'};

  return {graphDims: graphDims, scales: scales, maxDate: maxDate}

}

// TODO: change so that we don't have to remove svg elements every time.
// should be able to just update with d3
function renderData(state, svg){

// required: maxDate, margin, width, height, yTimeline, timelineColor, yCases, yDeaths

// unpack graphObject
graphDims = graphObject.graphDims
scales = graphObject.scales
maxDate = graphObject.maxDate


// get min date
var minDate = state.firstPolicy

// x-axis for all graphs
var x = graphObject.scales.x = d3.scaleLinear()
  .domain([minDate, maxDate])
  .range([graphDims.left, graphDims.width - graphDims.right])
  .clamp(true);

  {
    // create timelines
    svg
      .attr("width", graphDims.width)
      .attr("height", graphDims.height+ graphDims.bottom + graphDims.top)
      // .attr("height", (y.range()[1]+ margin.bottom + margin.top) * 3)
      .attr("font-family", "'Open Sans', 'Roboto', sans-serif")
      .attr("font-size", "10px")
      .attr("text-anchor", "end");

      var leftMargin = 75

      var topMargin = 15

      addText(svg, state.state, leftMargin, topMargin,"20px")

      addText(svg, "Population: " + d3.format(",")(state.casesData[0].population), leftMargin,
        topMargin + 15)

      addText(svg, "Cases: " + d3.format(",")(state.currentCases)
      + ", Deaths: " + d3.format(",")(state.currentDeaths),
        leftMargin, topMargin + 30)

      addText(svg, "Gov. " + state.governor, leftMargin, topMargin + 45)

    // helper function to add text box
    function addText(svg, text, x, y, fontSize="10px") {
      return svg.append("text")
              .attr("x", x)
              .attr("y", y)
              .attr("text-anchor", "start")
              .text(text)
              .style("font-size", fontSize)
    }

    // create timeline graphs

    const bar = svg.selectAll("g")
    .data(state.timeline)
    .join("g")
      .attr("transform", (d, i) => `translate(0,${scales.yTimeline(i)})`);

    // first timeline bars
    bar.append("rect")
      .attr("fill", d => scales.timelineColor(d.color))
      .attr("width", d => x(d.end - d.start + minDate.getTime()))
      .attr("x", d => x(d.start))
      .attr("height", scales.yTimeline.bandwidth() - 1)
      .attr("class", "timeline1");

    // second timeline bars
    bar.append("rect")
      .attr("fill", d => scales.timelineColor(d.color))
      .attr("width", d => x(d.end2 - d.start2 + minDate.getTime()))
      .attr("x", d => x(d.start2))
      .attr("height", scales.yTimeline.bandwidth() - 1)
      .attr("class", "timeline2");


    bar.selectAll("rect")
      .on("mouseover", handleMouseOverTimeline)
      .on("mouseout", handleMouseOutTimeline)
      .on("mousemove", handleMouseMoveTimeline)

// add text to each timeline
    // bar.append("text")
    //   .attr("fill", "white")
    //   .attr("x", d => x(d.end) - 3)
      // .attr("y", yTimeline.bandwidth() / 2)
    //   .attr("dy", "0.35em")
    //   .text(d => d.policy);


// x axis
    svg.append("g")
      .attr("transform", `translate(0,${scales.yTimeline.range()[1]})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

// create trending graphs
      svg.append("g")
      .attr("transform", `translate(${graphDims.left},${0})`)
      .call(d3.axisLeft(scales.yCases).ticks(5));

      const vertical_bars = svg
      .selectAll(".vb")
      .data(state.casesData)
      .enter().append("g").attr("class","vb");
      // .attr("transform", d => `translate(${x(d.date)},${height/3})`);

      vertical_bars.append("rect")
        .attr("width", 1)
        .attr("fill", d => scales.casesColor(d.color))
        // .attr("fill", "steelblue")
        .attr("x", d => x(d.date))
        .attr("height", d => graphDims.height/3 - scales.yCases(d.caseCapita))
        .attr("y", d => scales.yCases(d.caseCapita))
        ;

        vertical_bars.selectAll("rect")
        .on("mouseover", handleMouseOverVerticleBars)
        .on("mouseout", handleMouseOutVerticleBars)


        // y axis
        svg.append("g")
        .attr("transform", `translate(${graphDims.left},${0})`)
        .call(d3.axisLeft(scales.yCases).ticks(5));

        svg.append("g")
        .attr("transform", `translate(${graphDims.left},${graphDims.top})`)
        .call(d3.axisLeft(scales.yDeaths));

        const vertical_bars_2 = svg
        .selectAll(".vb2")
        .data(state.casesData)
        .enter().append("g").attr("class","vb2");

        vertical_bars_2.append("rect")
          .attr("width", 1)
          .attr("fill", d => scales.deathColor(d.color))
          // .attr("fill", "steelblue")
          .attr("x", d => x(d.date))
          .attr("height", d => scales.yDeaths(d.deaths) - graphDims.height * 2/3)
          .attr("y", graphDims.height * 2/3 + graphDims.top);

        vertical_bars_2.selectAll("rect")
          .on("mouseover", handleMouseOverVerticleBars)
          .on("mouseout", handleMouseOutVerticleBars)

        // add us cases
        var usLine = svg.append("path")
          .datum(usData)
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-dasharray", 3)
          .attr("stroke-width", 1.5)
          .attr("d", d3.line()
          .x(d => x(d.date))
          .y(d => scales.yCases(d.caseCapita))
          )

        usLine
        .on("mouseover", handleMouseOverUsLine)
        .on("mouseout", handleMouseOutUsLine)

        // // add us cases
        // svg.append("path")
        //   .datum(usData)
        //   .attr("fill", "none")
        //   .attr("stroke", "black")
        //   .attr("stroke-width", 1.5)
        //   .attr("d", d3.line()
        //   .x(d => x(d.date))
        //   .y(d => scales.yDeaths(d.deaths))
        //   )

// j
      }

}

//section for adding mouse events

var tooltip

// helper function to append a new line of text
function appendText(text, textContent) {
  text.html(textContent)
}

function createTooltip() {
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltipContainer")
    .style("pointer-events", "none")
    .style("background-color", "white")
    .style("opacity", 0.8)
    .style("max-width", "500px")
    .style("padding", "5px")
    .style("font-size", "10px")


    tooltip
    .style("position", "fixed")
    .style("top",d3.event.clientY - 67 + "px")
    .style("left", d3.event.clientX + "px")
    .attr("width", 100).attr("height", 67)

}

var formatTime = d3.timeFormat("%e %B")
var formatNumbers = d3.format(",")

function handleMouseOverVerticleBars(d, i) {

d3.select(this).attr("width", 5)

  createTooltip();

  var text = tooltip.append("text")

    appendText(text, formatTime(d.date) + "<br>"
      + "Cases: " + formatNumbers(d.cases) + "<br>"
      + "Deaths: " + formatNumbers(d.deaths))


}

function handleMouseOutVerticleBars(){
  // d3.select(this).style("stroke-width", 2).style("stroke", lineColor);
  d3.select(this).attr("width", 1)
  tooltip.remove()
}

// TODO: move to object

function handleMouseOverTimeline(d, i) {

  var selection = d3.select(this)

  selection.attr("fill", graphObject.scales.deathColor(d.color))

  createTooltip();

  // var width = "200px";
  // var height = "150px";

  var text = tooltip.append("text")

  var notes = ""

  if(d.notes != ""){
    notes = "<br>Notes: " + d.notes
  }

  if(selection.attr("class") == "timeline1"){
    appendText(text, d.policy + "<br>" + "Start Date: "
     + formatTime(d.start) + "<br>" + "End Date: "
     + formatTime(d.end) + notes)
  }

  else if (selection.attr("class") == "timeline2") {
    appendText(text, d.policy + "<br>" + "Start Date: "
     + formatTime(d.start2) + "<br>" + "End Date: "
     + formatTime(d.end2) + notes)
  }

}

function handleMouseMoveTimeline() {
  tooltip
    .style("top",d3.event.clientY - 67 + "px")
    .style("left", d3.event.clientX + "px")
}

function handleMouseOutTimeline(d) {

  d3.select(this).attr("fill", graphObject.scales.timelineColor(d.color))
  tooltip.remove()
}

function handleMouseOverUsLine(d) {

  // getNodeCoordinate(d3.select(this.parentElement));

  var x = d3.mouse(this.parentElement)[0]
  var date = getClosestDate(d,new Date(graphObject.scales.x.invert(x)))

  var dateData = d.filter(d => {
    return d.date == date
  })[0]

  var cases = dateData.cases
  var deaths = dateData.deaths

  createTooltip();

// TODO: get cases from graph
  var text = tooltip.append("text")

  appendText(text, formatTime(date) + "<br>"
    + "US Cases: " + formatNumbers(cases) + "<br>"
    + "US Deaths: " + formatNumbers(deaths))

  var selection = d3.select(this)
  selection.attr("stroke", graphObject.scales.deathColor("Swing"))
  selection.attr("stroke-width", 4.5)
}

function handleMouseOutUsLine(d) {
  var selection = d3.select(this)
  selection.attr("stroke", "black")
  selection.attr("stroke-width", 1)

  tooltip.remove()

}

// returns index of array corresponding to closest date
function getClosestDate(d, date) {
  var distanceArray = []
  d.forEach((d) => {
    distanceArray.push(Math.abs(d.date - date))
  });

  var index = distanceArray.findIndex((d) => {
    return d == d3.min(distanceArray)
  })

  return d[index].date

}

}
