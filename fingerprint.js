var trendingData
var timelineData
var data
const filteringState = {sortType: 'name', filterType: 'All'};

// main async function, used to wait for completion of asynch tasks
(async function() {
  google.charts.load('current');
  await setUpQuery('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=RAW_NYT_us-states',
'select *');
  var dataTable = await getQuery();
  var trendingData = createTrendingData(createTable(dataTable));
  await setUpQuery('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=July31_Timeline',
'select A, B, C, D, E, F, G, H, I')
  dataTable = await getQuery()

  timelineData = createtimelineData(createTable(dataTable))

  data = combineData(trendingData, timelineData);

  initGraphs(data)

// loop through each state and render data
  update(data);
})();

// update data and render
// TODO: refactor so that data doesn't have to be passed so often
function update(data) {

var data = filterBy(filteringState.filterType, sortBy(filteringState.sortType,data))

alert('updating')

renderAll(data)

}

function setSort(sortType, data) {
  filteringState.sortType = sortType
  update(data)
}

function setFilter(filterType, data) {
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

// combine trending Data and timelineData into a single json
function combineData(trendingData, timelineData){

  var data = []
// sort timeline data alphabetically so it can be grouped correcly
  timelineData = timelineData.sort((a,b) =>a.state.localeCompare(b.state))

  for(var i = 0; i< timelineData.length; i = i + 9){

    var casesData = trendingData.filter(d => {
      return d.state == timelineData[i].state})

    var timeline = timelineData.slice(i, i + 9)

    data.push({

      state: timelineData[i].state,
      // TODO: remove state, color, pact
      timeline: timeline,
      // TODO: remove state, stateDate and pact from casesData
      casesData: casesData,
      color: casesData[0].color,
      currentCases: d3.max(casesData.map(d => d.cases)),
      currentDeaths: d3.max(casesData.map(d => d.deaths)),
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
        renderData(state, d3.select("#fingerprint").append("svg"));
  });

// // TODO: renders out of order
  // d.forEach((state) => {
  //     setTimeout(function () {
  //       renderData(state, d3.select("#fingerprint").append("svg"));
  //     },0)
  // });
  // console.log(data);
}



var margin, width, height, maxDate, casesColor, timelineColor, deathColor, yCases, yDeaths

// initalize variables used by all graphs

function initGraphs(data) {
  // properties of svg size

  margin = ({top: 5, right: 0, bottom: 0, left: 60});
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

    svg.append("text").text(state.state + " Cases: " + d3.format(",")(state.currentCases)
    + ", Deaths: " + d3.format(",")(state.currentDeaths))
    .attr("transform", `translate(${margin.left + 250}, 10)`);

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

    bar.append("text")
      .attr("fill", "white")
      .attr("x", d => x(d.end) - 3)
      .attr("y", yTimeline.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => d.policy);

// x axis
    svg.append("g")
      .attr("transform", `translate(0,${yTimeline.range()[1]})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%m/%Y")));


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

        // y axis
        svg.append("g")
        .attr("transform", `translate(${margin.left},${0})`)
        .call(d3.axisLeft(yCases).ticks(5));

        svg.append("g")
        .attr("transform", `translate(${margin.left},${0})`)
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
          .attr("y", height * 2/3);

      }

}

















function processtimelineData(response) {

  // console.log(response)
  var timeLineArray = [];
  var casesArray = []
  var timelineData = response.getDataTable();
  dataTable = response.getDataTable();

  var casesData = timelineData.clone()

  timelineData.removeColumns(0,11)

  casesData.removeColumns(10,10)

  var columns = timelineData.getNumberOfColumns();
  var rows = timelineData.getNumberOfRows();

  var emptyRow;

  // find empty row
  for (var r = 0; r < rows; r++) {
    if (timelineData.getFormattedValue(r,0) == ""){
      emptyRow = r;
      break;
    }
  }

// truncate data at empty row
  timelineData.removeRows(emptyRow, rows - emptyRow);

  var columns = timelineData.getNumberOfColumns();
  var rows = timelineData.getNumberOfRows();
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < columns; c++) {
      row.push(timelineData.getFormattedValue(r, c));
    }

  var columns = timelineData.getNumberOfColumns();

  timeLineArray.push({
      policy: row[0],
      start: new Date(row[1]),
      end: new Date(row[2]),
      start2: new Date(row[3]),
      end2: new Date(row[4]),
      state: row[5],
      color: row[6],
      pact: row[7],
      notes: row[8],
  });

}

// get min and max dates
var minDate = d3.min(timeLineArray.map(d => d.start));
// var maxDate = d3.max(timeLineArray.map(d => d.end));
var maxDate = new Date(2020,08,01);
//


timelineData = [];

var columns = casesData.getNumberOfColumns();
var rows = casesData.getNumberOfRows();
for (var r = 0; r < rows; r++) {
  var row = [];
  for (var c = 0; c < columns; c++) {
    row.push(casesData.getFormattedValue(r, c));
  }

  // line graph
  casesArray.push({
    date: new Date(row[0]),
    state: row[1],
    fips: +row[2],
    cases: +row[3],
    deaths: +row[4],
    stateDate: row[5],
    population: +row[6],
    caseCapita: +row[7],
    pact: row[8],
    color: row[9],
  });
}

for(var i = 0; i< timeLineArray.length; i = i + 9){

  var casesData = casesArray.filter(d => {
    return d.state == timeLineArray[i].state})

  var data = timeLineArray.slice(i, i + 9)

  timelineData.push({

    state: timeLineArray[i].state,

    data: data,

    casesData: casesData,

    color: casesData[0].color,

    currentCases: d3.max(casesData.map(d => d.cases)),

    currentDeaths: d3.max(casesData.map(d => d.deaths)),

    firstPolicy: d3.min(data.map(d => d.start)),

    pact: casesData[0].pact
  })
}

// console.log(timelineData);

if(sort == 'cases'){
  timelineData.sort(function(a,b){
    return b.currentCases - a.currentCases;
  })
}

else if(sort == 'deaths'){
  timelineData.sort(function(a,b){
    return b.currentDeaths - a.currentDeaths;
  })
}

timelineData.forEach((stateData) => {
    renderData(stateData, d3.select("body").append("svg"));
});

  function renderData(data, svg){

  var margin = ({top: 5, right: 0, bottom: 0, left: 60});

  var width = 420;

  var height = 450;

  x = d3.scaleLinear()
    .domain([minDate, maxDate])
    .range([margin.left, width - margin.right])
    .clamp(true);

  y = d3.scaleBand()
    .domain(d3.range(data.data.length))
    .range([margin.top + height/3, 15 * data.data.length - margin.bottom + height/3])
    // .range([margin.top, 20 * data.data.length - margin.bottom])

  casesColor = d3.scaleOrdinal()
    .domain(['Republican','Swing','Democrat'])
    .range(['#F03F4E','#A47AF0','#6292F0'])

  timelineColor = d3.scaleOrdinal()
    .domain(['Republican','Swing','Democrat'])
    .range(['#D60012','#4B00D6','#0047D6'])

  deathColor = d3.scaleOrdinal()
    .domain(['Republican','Swing','Democrat'])
    .range(['#570007','#1E0057','#001D57'])

  yCases = d3.scaleLinear()
    .domain([0, .03])
    .range([height/3,0 + margin.top]);

  yDeaths = d3.scaleLinear()
  .domain([0, 32500])
  .range([height * 2/3,height])



    // create the timelines
    {
      svg
        .attr("width", width)
        .attr("height", height+ margin.bottom + margin.top)
        // .attr("height", (y.range()[1]+ margin.bottom + margin.top) * 3)
        .attr("font-family", "sans-serif")
        .attr("font-size", "10")
        .attr("text-anchor", "end");

      svg.append("text").text(data.state + " Cases: " + d3.format(",")(data.currentCases)
      + ", Deaths: " + d3.format(",")(data.currentDeaths))
      .attr("transform", `translate(${margin.left + 250}, 10)`);

      const bar = svg.selectAll("g")
      .data(data.data)
      .join("g")
        .attr("transform", (d, i) => `translate(0,${y(i)})`);

      bar.append("rect")
        // .attr("fill", "steelblue")
        .attr("fill", d => timelineColor(d.color))
        .attr("width", d => x(d.end - d.start + minDate.getTime()))

        .attr("x", d => x(d.start))
        .attr("height", y.bandwidth() - 1);

      bar.append("text")
        .attr("fill", "white")
        .attr("x", d => x(d.end) - 3)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(d => d.policy);

  // x axis
      svg.append("g")
        .attr("transform", `translate(0,${y.range()[1]})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%m/%Y")));


        // y axis
        svg.append("g")
        .attr("transform", `translate(${margin.left},${0})`)
        .call(d3.axisLeft(yCases).ticks(5));

        const vertical_bars = svg
        .selectAll(".vb")
        .data(data.casesData)
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

          // y axis
          svg.append("g")
          .attr("transform", `translate(${margin.left},${0})`)
          .call(d3.axisLeft(yCases).ticks(5));

          svg.append("g")
          .attr("transform", `translate(${margin.left},${0})`)
          .call(d3.axisLeft(yDeaths));

          const vertical_bars_2 = svg
          .selectAll(".vb2")
          .data(data.casesData)
          .enter().append("g").attr("class","vb2");

          vertical_bars_2.append("rect")
            .attr("width", 1)
            .attr("fill", d => deathColor(d.color))
            // .attr("fill", "steelblue")
            .attr("x", d => x(d.date))
            .attr("height", d => yDeaths(d.deaths) - height * 2/3)
            .attr("y", height * 2/3);

        }


  }

}

/*
TODO: *fix margin of timelines to align with other graph
*current case and death numbers in title
*sort (by cases, deaths, first policy implemented) and filter functions
(pacts, no mask policy, no stay-at-home policy)
*hover function for timeline (start, end date and notes),
for cases and deaths (get date and deaths)
* add in US comparison



*/
