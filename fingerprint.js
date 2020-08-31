{
alert('here')
var trendingData
var timelineData
var governorData
var data
const filteringState = {sortType: 'name', filterType: 'All'};
// main async function, used to wait for completion of asynch tasks
(async function() {
  google.charts.load('current');
  // load and prepare trending data
  await setUpQuery('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=RAW_NYT_us-states',
'select *');
  var dataTable = await getQuery();
  var trendingData = createTrendingData(createTable(dataTable));

  // load and prepare timeLine data
  await setUpQuery('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=July31_Timeline',
'select A, B, C, D, E, F, G, H, I')
  dataTable = await getQuery()
  timelineData = createtimelineData(createTable(dataTable))

  // load and prepare Governer Data
  await setUpQuery('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=Main_Categories',
'select A, N')
  dataTable = await getQuery()

  governorData = createGovernorData(createTable(dataTable))

  console.log(governorData);

  data = combineData(trendingData, timelineData, governorData);

  initGraphs(data)

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

function setPactFilter(filterType, data) {
  filteringState.filterType = filterType
  update(data)
}

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
  console.log(data);
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
  // console.log(data);
  // helper function to create container

  function createFingerprintContainer() {
    return d3.select("#fingerprint")
      .append("div")
      .style("class","fingerprintContainer")
      .style("width","440px")
      .style("height","470px")
      .style("padding", "10px")

  }

}



var margin, width, height, maxDate, casesColor, timelineColor, deathColor, yCases, yDeaths

// initalize variables used by all graphs

function initGraphs(data) {
  // properties of svg size

  margin = ({top: 15, right: 0, bottom: 0, left: 60});
  width = 420;
  height = 450;
  // alternative maxDate based on last date in data
  // var maxDate = d3.max(timeLineArray.map(d => d.end));
  maxDate = new Date(2020,08,01);

  // y-axis for timeline
  yTimeline = d3.scaleBand()
    .domain(d3.range(data[0].timeline.length))
    .range([margin.top + height/3, 15 * data[0].timeline.length - margin.bottom + height/3])

  // color scale for cases
  casesColor = d3.scaleOrdinal()
    .domain(['Republican','Swing','Democrat'])
    .range(['#F03F4E','#A47AF0','#6292F0'])

  // color scale for timeline
  timelineColor = d3.scaleOrdinal()
    .domain(['Republican','Swing','Democrat'])
    .range(['#D60012','#4B00D6','#0047D6'])

  // color scale for death graph
  deathColor = d3.scaleOrdinal()
    .domain(['Republican','Swing','Democrat'])
    .range(['#570007','#1E0057','#001D57'])

  // y-axis for cases
  yCases = d3.scaleLinear()
    .domain([0, .03])
    .range([height/3,0 + margin.top]);

  // y-axis for death graph
  yDeaths = d3.scaleLinear()
  .domain([0, 32500])
  .range([height * 2/3,height])

}

// TODO: change so that we don't have to remove svg elements every time.
// should be able to just update with d3
function renderData(state, svg){

// get min and max date
var minDate = state.firstPolicy

// x-axis for all graphs
x = d3.scaleLinear()
  .domain([minDate, maxDate])
  .range([margin.left, width - margin.right])
  .clamp(true);

  {
    // create timelines
    svg
      .attr("width", width)
      .attr("height", height+ margin.bottom + margin.top)
      // .attr("height", (y.range()[1]+ margin.bottom + margin.top) * 3)
      .attr("font-family", "sans-serif")
      .attr("font-size", "10")
      .attr("text-anchor", "end");

      // svg.style("z-index:", 3)


    // add titles to each graph
    svg.append("text").attr("x", 100).attr("y", 15).attr("text-anchor", "start")
      .text(state.state).style("font-size", "20px")
      .style("font-family","'Open Sans', 'Roboto', sans-serif")

    svg.append("text").attr("x", 100).attr("y", 30).attr("text-anchor", "start")
      .text("Cases: " + d3.format(",")(state.currentCases)
      + ", Deaths: " + d3.format(",")(state.currentDeaths))
      .style("font-size", "10px")
      .style("font-family","'Open Sans', 'Roboto', sans-serif")

    svg.append("text").attr("x", 100).attr("y", 45).attr("text-anchor", "start")
      .text("Gov. " + state.governor)
      .style("font-size", "10px")
      .style("font-family","'Open Sans', 'Roboto', sans-serif")

    const bar = svg.selectAll("g")
    .data(state.timeline)
    .join("g")
      .attr("transform", (d, i) => `translate(0,${yTimeline(i)})`);

    bar.append("rect")
      // .attr("fill", "steelblue")
      .attr("fill", d => timelineColor(d.color))
      .attr("width", d => x(d.end - d.start + minDate.getTime()))

      .attr("x", d => x(d.start))
      .attr("height", yTimeline.bandwidth() - 1);

    bar
      .on("mouseover", handleMouseOverTimeline)
      .on("mouseout", handleMouseOutTimeline)
      .on("mousemove", handleMouseMoveTimeline)

// add text to each timeline
    // bar.append("text")
    //   .attr("fill", "white")
    //   .attr("x", d => x(d.end) - 3)
    //   .attr("y", yTimeline.bandwidth() / 2)
    //   .attr("dy", "0.35em")
    //   .text(d => d.policy);


// x axis
    svg.append("g")
      .attr("transform", `translate(0,${yTimeline.range()[1]})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b")));


// create trending graphs
      svg.append("g")
      .attr("transform", `translate(${margin.left},${0})`)
      .call(d3.axisLeft(yCases).ticks(5));

      const vertical_bars = svg
      .selectAll(".vb")
      .data(state.casesData)
      .enter().append("g").attr("class","vb");
      // .attr("transform", d => `translate(${x(d.date)},${height/3})`);

      vertical_bars.append("rect")
        .attr("width", 1)
        .attr("fill", d => casesColor(d.color))
        // .attr("fill", "steelblue")
        .attr("x", d => x(d.date))
        .attr("height", d => height/3 - yCases(d.caseCapita))
        .attr("y", d => yCases(d.caseCapita))
        ;

        vertical_bars.selectAll("rect")
        .on("mouseover", handleMouseOverVerticleBars)
        .on("mouseout", handleMouseOutVerticleBars)


        // y axis
        svg.append("g")
        .attr("transform", `translate(${margin.left},${0})`)
        .call(d3.axisLeft(yCases).ticks(5));

        svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .call(d3.axisLeft(yDeaths));

        const vertical_bars_2 = svg
        .selectAll(".vb2")
        .data(state.casesData)
        .enter().append("g").attr("class","vb2");

        vertical_bars_2.append("rect")
          .attr("width", 1)
          .attr("fill", d => deathColor(d.color))
          // .attr("fill", "steelblue")
          .attr("x", d => x(d.date))
          .attr("height", d => yDeaths(d.deaths) - height * 2/3)
          .attr("y", height * 2/3 + margin.top);

        vertical_bars_2
          .on("mouseover", handleMouseOverVerticleBars)
          .on("mouseout", handleMouseOutVerticleBars)
// j
      }

}

// helper function to append a new line of text
function appendText(text, textContent) {
  text.html(textContent)
}

var tooltip

function createTooltip() {
  tooltip = d3.select("body").append("div")
    .attr("class", "tooltipContainer")
    .style("pointer-events", "none")
    .style("background-color", "white")
    .style("opacity", 0.8)
    .style("max-width", "500px")
    .style("padding", "5px")
    .style("font-size", "10px")


    // console.log(tooltip);
    tooltip
    .style("position", "fixed")
    .style("top",d3.event.clientY - 67 + "px")
    .style("left", d3.event.clientX + "px")
    .attr("width", 100).attr("height", 67)

}

var formatTime = d3.timeFormat("%e %B")
var formatNumbers = d3.format(",")

function handleMouseOverVerticleBars(d, i) {
  // console.log(d.date);
  // console.log(d.cases);
  createTooltip();

  var text = tooltip.append("text")

    appendText(text, formatTime(d.date) + "<br>"
      + "Cases: " + formatNumbers(d.cases) + "<br>"
      + "Deaths: " + formatNumbers(d.deaths))


}

function handleMouseOutVerticleBars(){
  // d3.select(this).style("stroke-width", 2).style("stroke", lineColor);
  tooltip.remove()
}

function handleMouseOverTimeline(d, i) {
  createTooltip();

  var width = "200px";
  var height = "150px";

  var text = tooltip.append("text")

  appendText(text, d.policy + "<br>" + "Start Date: "
   + formatTime(d.start) + "<br>" + "End Date: "
   + formatTime(d.end) + "<br>" + "Notes: " + d.notes)

  // appendText(text, d.policy)
  // appendText(text, "Start Date: " + formatTime(d.start))
  // appendText(text, "End Date: " + formatTime(d.end))
  // appendText(text, "Notes: " + d.notes)


}

function handleMouseMoveTimeline() {
  tooltip
    .style("top",d3.event.clientY - 67 + "px")
    .style("left", d3.event.clientX + "px")
}

function handleMouseOutTimeline() {
  tooltip.remove()
}


function getNodeCoordinate(el) {
    el = el.node()
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { y: rect.top + scrollTop, x: rect.left + scrollLeft }
}
}
