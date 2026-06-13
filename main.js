
d3.queue()
  .defer(d3.json, "//unpkg.com/world-atlas@1.1.4/world/50m.json")
  .defer(d3.csv, "./data/newfulldata2.csv", function(row) {
    return {
      continent: row.Continent,
      country: row.Country,
      countryCode: row["Country Code"],
      emissions: +row["Emissions"],
      emissionsPerCapita: +row["Emissions Per Capita"],
      region: row.Region,
      year: +row.Year,
      population: +row["Population"]
    }
  })
  .await(function(error, mapData, data) {
    if (error) throw error;

    var extremeYears = d3.extent(data, d => d.year);
    var currentYear = extremeYears[0]; //set initial year to 1990
    var currentpopulation = 0;
    var currentDataType = d3.select('input[name="data-type"]:checked')
                            .attr("value");
    //console.log("the current datatype is "+ currentDataType);     is emission   
    //convert from TopoJSON data into GeoJSON features, which represent the countries         
    var geoData = topojson.feature(mapData, mapData.objects.countries).features; //for the geodata of the map can be access

    var mapContainer = d3.select(".map-container").node();
    var mapWidth = mapContainer.clientWidth;
    var mapHeight = mapContainer.clientHeight;

    //setting the height and width for the sizing of both the bar and pie chart
    var width = +d3.select(".charts-container")
                   .node().offsetWidth;
    var height = 300;

    createMap(geoData, mapWidth, mapHeight);
    setMapState(geoData, data);
    createPie(width, height);
    createBar(width, height);
    drawMap(geoData, data, currentYear, currentDataType);
    drawPie(data, currentYear);
    drawBar(data, currentDataType, "");
    setupMapResize();
    requestAnimationFrame(function() {
      resizeMap();
      window.dispatchEvent(new Event("resize"));
    });

  
    d3.select("#year")
        .property("min", currentYear)
        .property("max", extremeYears[1])
        .property("value", currentYear)
        .on("input", () => {
          currentYear = +d3.event.target.value;
          drawMap(geoData, data, currentYear, currentDataType);
          drawPie(data, currentYear);
          highlightBars(currentYear);
        });

    d3.select("#population")
        .property("popvalue", currentpopulation)
        .on("change", () => {
          currentpopu = +d3.event.target.popValue;
          //console.log("current pop :"+ currentpopu);

        });

    d3.selectAll('input[name="data-type"]')
        .on("change", () => {
          var active = d3.select(".active").data()[0];
          var country = active ? active.properties.country : "";
          currentDataType = d3.event.target.value;
          drawMap(geoData, data, currentYear, currentDataType);
          drawBar(data, currentDataType, country);
        });

    
    d3.selectAll("svg")
        .on("mousemove touchmove", updateTooltip);

    function updateTooltip() {
      var tooltip = d3.select(".tooltip");
      var tgt = d3.select(d3.event.target);
      var isCountry = tgt.classed("country");
      var isBar = tgt.classed("bar");
      var isArc = tgt.classed("arc");
      var dataType = d3.select("input:checked")
                       .property("value");
      var units = dataType === "emissions" ? "thousand metric tons" : "metric tons per capita";
      var data;
      var percentage = "";
      var populationn = 0;

      if (isCountry) data = tgt.data()[0].properties;
      if (isArc) {
        data = tgt.data()[0].data;
        percentage = `<p>Percentage of total: ${getPercentage(tgt.data()[0])}</p>`;
        //populationn = `<p>Population: ${getPercentage(tgt.data()[0])}</p>`
      }
      if (isBar) data = tgt.data()[0];
      tooltip
          .style("opacity", +(isCountry || isArc || isBar))
          .style("left", (d3.event.pageX - tooltip.node().offsetWidth / 2) + "px")
          .style("top", (d3.event.pageY - tooltip.node().offsetHeight - 10) + "px");

      if (data) {
        var dataValue = data[dataType] ? data[dataType].toLocaleString() + " " + units : "Data Not Available";
        var popValue = data[populationn];
        //console.log("the data is "+ popValue);
        tooltip 
            .html(`
              <p>Country: ${data.country}</p>
              <p>${formatDataType(dataType)}: ${dataValue}</p>
              <p>Year: ${data.year || d3.select("#year").property("value")}</p>
              ${percentage}
              <p>Population: ${data.population }</p>
            `)
      }
    }


  });

function formatDataType(key) {
  return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, c => " " + c);
}

function getPercentage(d) {
  var angle = d.endAngle - d.startAngle;
  var fraction = 100 * angle / (Math.PI * 2);
  return fraction.toFixed(2) + "%";
}


















