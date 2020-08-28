var dataTable;


// main async function, used to wait for completion of asynch tasks
(async function() {
  await setUpQuery();
  dataTable = await getQuery();

  processTimelineData(dataTable);

})();

function setUpQuery() {
   var promise = new Promise(function(resolve, reject) {
       google.charts.load('current');
       google.charts.setOnLoadCallback(function(){
           query = new google.visualization.Query('https://docs.google.com/spreadsheets/d/1r2KLSBgiou-osetpUPE3lp2nLh5dWOjuPScGft81AoY/gviz/tq?sheet=COMBINED');
           query.setQuery('select A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T');
          resolve('done');
       }
);
   });
   return promise;
}

function getQuery(){
  var promise = new Promise(function(resolve, reject){
    query.send(function(response){
      resolve(response);
    })
  });
  return promise;
}

var sort;

function processTimelineData(response) {

  // console.log(response)
  var timeLineArray = [];
  var casesArray = []
  var timeLineData = response.getDataTable();
  dataTable = response.getDataTable();

  var casesData = timeLineData.clone()

  timeLineData.removeColumns(0,11)

  casesData.removeColumns(10,10)

  var columns = timeLineData.getNumberOfColumns();
  var rows = timeLineData.getNumberOfRows();

  var emptyRow;

  // find empty row
  for (var r = 0; r < rows; r++) {
    if (timeLineData.getFormattedValue(r,0) == ""){
      emptyRow = r;
      break;
    }
  }

// truncate data at empty row
  timeLineData.removeRows(emptyRow, rows - emptyRow);

  var columns = timeLineData.getNumberOfColumns();
  var rows = timeLineData.getNumberOfRows();
  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < columns; c++) {
      row.push(timeLineData.getFormattedValue(r, c));
    }

  var columns = timeLineData.getNumberOfColumns();

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


timeLineData = [];

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

  timeLineData.push({

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

// console.log(timeLineData);

if(sort == 'cases'){
  timeLineData.sort(function(a,b){
    return b.currentCases - a.currentCases;
  })
}

else if(sort == 'deaths'){
  timeLineData.sort(function(a,b){
    return b.currentDeaths - a.currentDeaths;
  })
}
console.log(timeLineData);

timeLineData.forEach((stateData) => {
    renderData(stateData, d3.select("#fingerprint").append("svg"));
});


  // renderData(array);


  function renderData(data, svg){

    // customize min and max dates
  // minDate = d3.min(data.data.map(d => d.start));
  // maxDate = d3.max(data.data.map(d => d.end));

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

  y2 = d3.scaleLinear()
    .domain([0, .03])
    .range([height/3,0 + margin.top]);

  y3 = d3.scaleLinear()
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
        .call(d3.axisLeft(y2).ticks(5));

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
          .attr("height", d => height/3 - y2(d.caseCapita))
          .attr("y", d => y2(d.caseCapita))
          ;

          // y axis
          svg.append("g")
          .attr("transform", `translate(${margin.left},${0})`)
          .call(d3.axisLeft(y2).ticks(5));

          svg.append("g")
          .attr("transform", `translate(${margin.left},${0})`)
          .call(d3.axisLeft(y3));

          const vertical_bars_2 = svg
          .selectAll(".vb2")
          .data(data.casesData)
          .enter().append("g").attr("class","vb2");

          vertical_bars_2.append("rect")
            .attr("width", 1)
            .attr("fill", d => deathColor(d.color))
            // .attr("fill", "steelblue")
            .attr("x", d => x(d.date))
            .attr("height", d => y3(d.deaths) - height * 2/3)
            .attr("y", height * 2/3)
            ;

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
