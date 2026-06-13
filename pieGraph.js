
function createPie(width, height) {
  var pie = d3.select("#pie")
                  .attr("width", width)
                  .attr("height", height);

  pie.append("g")
      .classed("chart", true);
      
  pie.append("g")
      .classed("legend", true);

  pie.append("text")
      .classed("pie-title", true);
  
  // Store the current data and dimensions
  pie.node().__currentData = [];
  pie.node().__currentYear = null;
  pie.node().__selectedCountry = "";
  
  responsivefyPie(pie);
}

function drawPie(data, currentYear) {
  var pie = d3.select("#pie");
  
  // Store current data and year
  pie.node().__currentData = data;
  pie.node().__currentYear = currentYear;
  
  updatePieChart(pie.node());
}

function highlightPieCountry(country) {
  var pie = d3.select("#pie");
  pie.node().__selectedCountry = country || "";

  if (pie.node().__currentData.length > 0) {
    updatePieChart(pie.node());
  }
}

function applyPieSelection(pie, arcData, path, radius, colorScale, selectedCountry) {
  var hasSelection = !!selectedCountry;

  pie.select(".chart").selectAll(".arc")
    .attr("opacity", function(d) {
      if (!hasSelection) return 1;
      return d.data.country === selectedCountry ? 1 : 0.35;
    })
    .attr("stroke", function(d) {
      return d.data.country === selectedCountry ? "#2c3e50" : "#dff1ff";
    })
    .attr("stroke-width", function(d) {
      return d.data.country === selectedCountry ? "2.5px" : "0.25px";
    });

  var chart = pie.select(".chart");
  var indicatorGroup = chart.select(".pie-indicator");
  if (indicatorGroup.empty()) {
    indicatorGroup = chart.append("g").attr("class", "pie-indicator");
  }
  indicatorGroup.selectAll("*").remove();
  indicatorGroup.raise();

  if (!hasSelection) {
    pie.select(".legend").selectAll(".legend-item").attr("opacity", 1);
    pie.select(".legend").select(".legend-selection").remove();
    return;
  }

  var selected = arcData.find(function(d) {
    return d.data.country === selectedCountry;
  });

  if (!selected) {
    pie.select(".legend").selectAll(".legend-item").attr("opacity", 1);
    pie.select(".legend").select(".legend-selection").remove();
    return;
  }

  var share = ((selected.endAngle - selected.startAngle) / (Math.PI * 2) * 100).toFixed(2);

  var pointerArc = d3.arc()
    .innerRadius(radius * 1.02)
    .outerRadius(radius * 1.14);

  indicatorGroup.append("path")
    .attr("class", "pie-selection-ring")
    .attr("d", pointerArc(selected))
    .attr("fill", colorScale(selected.data.continent))
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 2);

  var centroid = path.centroid(selected);
  var dist = Math.sqrt(centroid[0] * centroid[0] + centroid[1] * centroid[1]) || 1;
  var nx = centroid[0] / dist;
  var ny = centroid[1] / dist;
  var markerDist = radius * 1.22;
  var labelDist = radius * 1.32;

  var svgHeight = +pie.attr("height");
  var svgWidth = +pie.attr("width");
  var marginTop = Math.max(40, svgHeight * 0.16);
  var titleFontSize = Math.max(14, Math.min(22, svgWidth / 35));
  var chartCenterY = svgHeight / 2 + marginTop * 0.08;
  var titleBottom = marginTop * 0.45 + titleFontSize * 1.1;
  var safeMinLabelY = -(chartCenterY - titleBottom - 12);

  var markerX, markerY, labelX, labelY, anchor;

  if (ny * labelDist < safeMinLabelY) {
    var side = nx >= 0 ? 1 : -1;
    var bend = radius * 0.28;
    markerX = centroid[0] + side * bend;
    markerY = centroid[1] + radius * 0.08;
    labelX = markerX + side * (radius * 0.14 + selected.data.country.length * 2.5);
    labelY = markerY;
    anchor = side > 0 ? "start" : "end";
  } else {
    markerX = nx * markerDist;
    markerY = ny * markerDist;
    labelX = nx * labelDist;
    labelY = ny * labelDist;
    anchor = labelX >= 0 ? "start" : "end";
  }

  indicatorGroup.append("line")
    .attr("class", "pie-selection-line")
    .attr("x1", centroid[0])
    .attr("y1", centroid[1])
    .attr("x2", markerX)
    .attr("y2", markerY)
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,3");

  indicatorGroup.append("circle")
    .attr("class", "pie-selection-marker")
    .attr("cx", markerX)
    .attr("cy", markerY)
    .attr("r", 5)
    .attr("fill", "#FE9D52")
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 2);

  indicatorGroup.append("text")
    .attr("class", "pie-selection-label")
    .attr("x", labelX)
    .attr("y", labelY)
    .attr("text-anchor", anchor)
    .attr("dy", "0.35em")
    .attr("fill", "#2c3e50")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .text(selected.data.country);

  var legend = pie.select(".legend");
  var legendFontSize = Math.max(11, Math.min(14, svgWidth / 65));
  var legendSpacing = legendFontSize * 1.5;
  var legendOffsetY = colorScale.domain().length * legendSpacing + legendFontSize * 0.8;

  legend.select(".legend-selection").remove();

  var selectionInfo = legend.append("g")
    .attr("class", "legend-selection")
    .attr("transform", "translate(0, " + legendOffsetY + ")");

  selectionInfo.append("line")
    .attr("x1", 0)
    .attr("x2", legendFontSize * 7)
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#cbd5e0")
    .attr("stroke-width", 1);

  selectionInfo.append("text")
    .attr("class", "legend-selection-country")
    .attr("y", legendFontSize * 1.6)
    .attr("fill", "#2c3e50")
    .style("font-size", legendFontSize + "px")
    .style("font-weight", "600")
    .text(selected.data.country);

  selectionInfo.append("text")
    .attr("class", "legend-selection-share")
    .attr("y", legendFontSize * 2.9)
    .attr("fill", "#5a6a7a")
    .style("font-size", (legendFontSize - 1) + "px")
    .text(share + "% of total");

  pie.select(".legend").selectAll(".legend-item")
    .attr("opacity", function(d) {
      return d === selected.data.continent ? 1 : 0.4;
    });
}

function updatePieChart(svgNode) {
  const pie = d3.select(svgNode);
  const data = svgNode.__currentData;
  const currentYear = svgNode.__currentYear;
  
  // Get current dimensions
  const width = +pie.attr("width");
  const height = +pie.attr("height");
  
  // Calculate margins based on container size
  const margin = {
    top: Math.max(40, height * 0.16),
    right: Math.max(20, width * 0.08),
    bottom: Math.max(20, height * 0.08),
    left: Math.max(20, width * 0.08)
  };

  // Calculate radius - using the full available space
  const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) * 0.37;

  // Center the chart below the title
  pie.select(".chart")
     .attr("transform", `translate(${width / 2}, ${(height / 2) + margin.top * 0.08})`);

  // Update legend position
  const legendX = width - margin.right - (width * 0.22);
  pie.select(".legend")
     .attr("transform", `translate(${legendX}, ${height * 0.2})`);

  const yearData = data.filter(d => d.year === currentYear);
  
  // Get unique continents
  const continents = [...new Set(yearData.map(d => d.continent))];

  const colorScale = d3.scaleOrdinal()
    .domain(continents)
    .range(["#F6C85F", "#4198D7", "#000000", "#E55759", "#009F3D"]);

  const arcGenerator = d3.pie()
    .sort((a, b) => {
      if (a.continent < b.continent) return -1;
      if (a.continent > b.continent) return 1;
      return a.emissions - b.emissions;
    })
    .value(d => d.emissions);

  const path = d3.arc()
    .outerRadius(radius)
    .innerRadius(radius * 0.4);

  const arcData = arcGenerator(yearData);

  // Update arcs
  const update = pie.select(".chart")
    .selectAll(".arc")
    .data(arcData);

  update.exit().remove();

  update.enter()
    .append("path")
    .classed("arc", true)
    .attr("stroke", "#dff1ff")
    .attr("stroke-width", "0.25px")
    .merge(update)
    .attr("fill", d => colorScale(d.data.continent))
    .attr("d", path);

  // Update legend
  const legendFontSize = Math.max(11, Math.min(14, width / 65));
  const legendSpacing = legendFontSize * 1.5;
  
  const legend = pie.select(".legend")
    .selectAll(".legend-item")
    .data(colorScale.domain());

  const legendEnter = legend.enter()
    .append("g")
    .classed("legend-item", true);

  legendEnter.append("rect")
    .attr("width", legendFontSize)
    .attr("height", legendFontSize);

  legendEnter.append("text")
    .attr("x", legendFontSize * 1.5)
    .attr("y", legendFontSize * 0.8);

  const legendUpdate = legend.merge(legendEnter)
    .attr("transform", (d, i) => `translate(0, ${i * legendSpacing})`);

  legendUpdate.select("rect")
    .attr("fill", d => colorScale(d));

  legendUpdate.select("text")
    .style("font-size", `${legendFontSize}px`)
    .text(d => d);

  legend.exit().remove();

  // Update title
  const titleFontSize = Math.max(14, Math.min(22, width / 35));
  pie.select(".pie-title")
    .attr("x", width / 2)
    .attr("y", margin.top * 0.45)
    .attr("font-size", `${titleFontSize}px`)
    .style("text-anchor", "middle")
    .style("font-weight", "600")
    .text(`Total Global Emissions grouped by continent and region, ${currentYear}`);

  applyPieSelection(
    pie,
    arcData,
    path,
    radius,
    colorScale,
    svgNode.__selectedCountry || ""
  );
}

function getChartPanelSize(svgNode) {
  var panel = svgNode.parentNode;
  if (!panel) return { width: 0, height: 0 };
  return {
    width: panel.clientWidth,
    height: panel.clientHeight
  };
}

function responsivefyPie(svg) {
  function resizePie() {
    var size = getChartPanelSize(svg.node());
    if (size.width === 0 || size.height === 0) return;

    svg.attr("width", size.width)
       .attr("height", size.height);

    if (svg.node().__currentData.length > 0) {
      updatePieChart(svg.node());
    }
  }

  var resizeTimeout;
  function debouncedResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizePie, 150);
  }

  resizePie();

  d3.select(window).on("resize.pie", debouncedResize);

  if (typeof ResizeObserver !== "undefined") {
    var observer = new ResizeObserver(debouncedResize);
    observer.observe(svg.node().parentNode);
    svg.node().__chartResizeObserver = observer;
  }

  return function() {
    d3.select(window).on("resize.pie", null);
    clearTimeout(resizeTimeout);
    if (svg.node().__chartResizeObserver) {
      svg.node().__chartResizeObserver.disconnect();
    }
  };
}