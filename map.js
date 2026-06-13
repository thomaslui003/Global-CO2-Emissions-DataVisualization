var mapState = {
  geoData: null,
  climateData: null
};

var MAP_TOOLBAR = {
  height: 52,
  paddingX: 16,
  buttonWidth: 104,
  buttonHeight: 32,
  buttonRadius: 8
};

function getMapToolbarLayout(width) {
  var t = MAP_TOOLBAR;
  return {
    width: width,
    height: t.height,
    paddingX: t.paddingX,
    buttonX: t.paddingX,
    buttonY: (t.height - t.buttonHeight) / 2,
    buttonWidth: t.buttonWidth,
    buttonHeight: t.buttonHeight,
    buttonCenterX: t.paddingX + t.buttonWidth / 2,
    buttonCenterY: t.height / 2,
    titleX: width / 2,
    titleY: t.height / 2
  };
}

function getMapDimensions() {
  var container = d3.select(".map-container").node();
  return {
    width: container.clientWidth,
    height: container.clientHeight
  };
}

function updateMapChrome(width) {
  var layout = getMapToolbarLayout(width);

  d3.select(".toolbar-background")
    .attr("width", layout.width)
    .attr("height", layout.height);

  d3.select("#reset-zoom-button-bg")
    .attr("x", layout.buttonX)
    .attr("y", layout.buttonY)
    .attr("width", layout.buttonWidth)
    .attr("height", layout.buttonHeight)
    .attr("rx", MAP_TOOLBAR.buttonRadius)
    .attr("ry", MAP_TOOLBAR.buttonRadius);

  d3.select("#reset-zoom-button")
    .attr("x", layout.buttonCenterX)
    .attr("y", layout.buttonCenterY);

  d3.select(".map-title")
    .attr("x", layout.titleX)
    .attr("y", layout.titleY)
    .style("font-size", Math.max(14, Math.min(22, width / 35)) + "px");

  d3.select(".map-toolbar").raise();
}

function setMapState(geoData, climateData) {
  mapState.geoData = geoData;
  mapState.climateData = climateData;
}

function resizeMap() {
  if (!mapState.geoData || !mapState.climateData) return;

  var dims = getMapDimensions();
  if (dims.width === 0 || dims.height === 0) return;

  d3.select("#map")
    .attr("width", dims.width)
    .attr("height", dims.height);

  updateMapChrome(dims.width);

  // Reset zoom so the new projection and transform stay aligned
  d3.select("#map").property("__zoom", d3.zoomIdentity);

  var currentYear = +d3.select("#year").property("value");
  var currentDataType = d3.select("input:checked").property("value");
  drawMap(mapState.geoData, mapState.climateData, currentYear, currentDataType);
}

function setupMapResize() {
  var resizeTimer;
  d3.select(window).on("resize.map", function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeMap, 150);
  });
}

function createMap(geoData,width, height) {

  //selecting the <svg> layer
  const svg = d3.select("#map")
        .attr("width", width)
        .attr("height", height);
  
  
  //under <svg>, created <g class=map-group>
  svg.append("g")
    .attr("class", "map-group");


    const defs = svg.append("defs");
  
    // Define the shadow filter for reset zoom button
    const filter = defs.append("filter")
      .attr("id", "drop-shadow")
      .attr("height", "130%");
  
    filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 3)
      .attr("result", "shadow");
  
    filter.append("feOffset")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "shadow");
  
    filter.append("feComponentTransfer")
      .append("feFuncA")
      .attr("type", "linear")
      .attr("slope", 0.3);
  
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode");
    feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
  
    // Create unified top toolbar for reset button and title
    const layout = getMapToolbarLayout(width);
    const toolbar = svg.append("g").attr("class", "map-toolbar");

    toolbar.append("rect")
      .attr("class", "toolbar-background")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", layout.width)
      .attr("height", layout.height)
      .attr("fill", "rgba(255, 255, 255, 0.96)")
      .attr("stroke", "#e8e8e8")
      .attr("stroke-width", 1);

    const buttonGroup = toolbar.append("g")
      .attr("class", "reset-zoom-group");

    //zoom Icon animation initialization
    const zoomIcon = svg.append("g")
    .attr("class", "zoom-icon")
    .attr("transform", `translate(${width / 2 - 40}, ${height / 2 - 40})`);
  
    zoomIcon.append("circle")
      .attr("r", 15)
      .attr("fill", "none")
      .attr("stroke", "#454444")
      .attr("stroke-width", 2);
  
    zoomIcon.append("line")
      .attr("x1", 12)
      .attr("y1", 12)
      .attr("x2", 22)
      .attr("y2", 22)
      .attr("stroke", "#454444")
      .attr("stroke-width", 2);
  
    // Animate the magnifying glass
    function animateZoomIcon() {
      zoomIcon.transition()
        .duration(1000)
        .attr("transform", `translate(${width / 2 - 40}, ${height / 2 - 40}) scale(1.5)`)
        .transition()
        .duration(1000)
        .attr("transform", `translate(${width / 2 - 40}, ${height / 2 - 40}) scale(1)`)
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    }
  

    // Add floating hint text
    const hintText = svg.append("text")
      .attr("class", "zoom-hint")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#454444")
      .style("font-size", "16px")
      .style("opacity", 0)
      .text("Scroll to Zoom");

    // Animate hint text with floating effect
    hintText.transition()
      .duration(1000)
      .style("opacity", 0.9)
      .transition()
      .duration(1000)
      .attr("y", height / 2 - 10)
      .transition()
      .duration(1000)
      .attr("y", height / 2)
      .style("opacity", 0)
      .remove();

    // Sequence the animations
    animateZoomIcon();

    //the rectangle button 
    const resetButton = buttonGroup.append("rect")
      .attr("id", "reset-zoom-button-bg")
      .attr("x", layout.buttonX)
      .attr("y", layout.buttonY)
      .attr("width", layout.buttonWidth)
      .attr("height", layout.buttonHeight)
      .attr("fill", "#ffffff")
      .attr("stroke", "#d0d0d0")
      .attr("rx", MAP_TOOLBAR.buttonRadius)
      .attr("ry", MAP_TOOLBAR.buttonRadius)
      .attr("filter", "url(#drop-shadow)")
      .style("cursor", "pointer")
      .on("mouseover", function() {
        d3.select(this)
          .attr("fill", "#f7f7f7")
          .attr("stroke", "#FE9D52");
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("fill", "#ffffff")
          .attr("stroke", "#d0d0d0");
      })
      .on("click", function() {
        // This will be populated in the drawMap function
      });


        // Add initial pulse animation to the button
    function pulseButton() {
      resetButton
        .transition()
        .duration(800)
        .attr("stroke", "#FE9D52")
        .attr("stroke-width", "2")
        .transition()
        .duration(800)
        .attr("stroke", "#d0d0d0")
        .attr("stroke-width", "1");
    }

    // Pulse the button 3 times
    pulseButton();
    setTimeout(pulseButton, 1700);
    setTimeout(pulseButton, 3400);

    buttonGroup.append("text")
    .attr("id", "reset-zoom-button")
    .attr("x", layout.buttonCenterX)
    .attr("y", layout.buttonCenterY)
    .attr("font-size", "13px")
    .attr("font-weight", "600")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", "#2d2c2c")
    .attr("cursor", "pointer")
    .text("Reset Zoom")
    .on("mouseover", function() {
      d3.select("#reset-zoom-button-bg")
        .attr("fill", "#f7f7f7")
        .attr("stroke", "#FE9D52");
    })
    .on("mouseout", function() {
      d3.select("#reset-zoom-button-bg")
        .attr("fill", "#ffffff")
        .attr("stroke", "#d0d0d0");
    })
    .on("click", function() {
      // This will be populated in the drawMap function
    });

  toolbar.append("text")
    .attr("x", layout.titleX)
    .attr("y", layout.titleY)
    .attr("font-weight", "600")
    .attr("fill", "#2c3e50")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .classed("map-title", true);

  updateMapChrome(width);
}


function drawMap(geoData, climateData, year, dataType) {

  var map = d3.select("#map");
  var mapGroup = map.select(".map-group");
  var width = +map.attr("width");
  var height = +map.attr("height");

  mapGroup.selectAll("*").remove();
  
  var projection = d3.geoMercator()
    .fitExtent(
      [[20, MAP_TOOLBAR.height + 14], [width - 20, height - 20]],
      { type: "FeatureCollection", features: geoData }
    );

  //define map path
  var path = d3.geoPath()
    .projection(projection);

  d3.select("#year-val").text(year);

  //match geodata with climate data, ensure have country name, find data for specific 
  // d is each of the detailed points
  geoData.forEach(d => {
    var countries = climateData.filter(row => row.countryCode === d.id);
    var name = '';
    if (countries.length > 0) name = countries[0].country;
    d.properties = countries.find(c => c.year === year) || { country: name };
  });

  var colours = ["#f1c40f", "#e67e22", "#e74c3c", "#c0392b"]; //the colour range for map (yellow to red for indication of severity)

  var domains = {
    emissions: [0, 2.5e5, 1e6, 5e6],
    emissionsPerCapita: [0, 0.5, 2, 10]
  };

  var mapColorScale = d3.scaleLinear()
    .domain(domains[dataType])
    .range(colours);

  const currentTransform = d3.zoomTransform(map.node()) || d3.zoomIdentity;

  

  //need to separate this update var with the update click event below to enable other interaction 
  var update = mapGroup.selectAll(".country")
    .data(geoData)
    .enter()
    .append("path")
    .classed("country", true)
    .attr("d", path)
    //current transform keeps the existing zoom level
    .attr("transform", currentTransform);


  update
    .on("click", function () {
      var currentDataType = d3.select("input:checked")
        .property("value");
      var country = d3.select(this);
      var isActive = country.classed("active");
      var countryName = isActive ? "" : country.data()[0].properties.country;
      drawBar(climateData, currentDataType, countryName);
      highlightBars(+d3.select("#year").property("value"));
      highlightPieCountry(countryName);
      d3.selectAll(".country").classed("active", false);
      country.classed("active", !isActive);
    })
    .merge(update)
    .transition()
    .duration(750)
    .attr("fill", d => {
      var val = d.properties[dataType];
      return val ? mapColorScale(val) : "#ccc";
    })

    
  d3.select(".map-title")
    .text("CO2 " + graphTitle(dataType) + " in " + year);

  updateMapChrome(width);
  d3.select(".map-toolbar").raise();


  const zoom = d3.zoom()
    .scaleExtent([1,16])
    .translateExtent([[0,0],[width, height]])
    .on("zoom", zoomed);


    map.call(zoom)
      .call(zoom.transform, currentTransform);;

  

  function zoomed(){
    update.attr("transform", d3.event.transform)  
  }

  d3.select(".reset-zoom-group")
    .on("click", function() {
      map.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
    });


  
}


function graphTitle(str) {
  return str.replace(/[A-Z]/g, c => " " + c.toLowerCase());
}

