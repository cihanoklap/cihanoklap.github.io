// Variables
const margin = { top: 40, right: 60, bottom: 10, left: 80 };
const graphWidth = 720 - margin.left - margin.right;
const graphHeight = 720 - margin.top - margin.bottom;

const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', graphWidth + margin.left + margin.right)
    .attr('height', graphHeight + margin.top + margin.bottom)

const graph = svg.append('g')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('transform', `translate(${margin.right},${margin.top})`);


var radius = Math.min(graphWidth, graphHeight) / 2;
var color = d3.scaleOrdinal(d3.schemeBlues[8]);

// Size our <svg> element, add a <g> element, and move translate 0,0 to the center of the element.
var g = d3.select('svg')
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .style("font", "8px sans-serif")
    .append('g')
    .attr('transform', 'translate(' + graphWidth / 2 + ',' + graphHeight / 2 + ')');

// Create our sunburst data structure and size it.
var partition = d3.partition()
    .size([2 * Math.PI, radius]);

//Tooltip description
var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("opacity", 0);

// Get the data from our JSON file
d3.json("data.json", function(error, nodeData) {
    if (error) throw error;

    allNodes = nodeData;
    var showNodes = JSON.parse(JSON.stringify(nodeData));
    drawSunburst(allNodes);
});

function drawSunburst(data) {
    // Find the root node, calculate the node.value, and sort our nodes by node.value
    root = d3.hierarchy(data)
        .sum(function (d) { return d.size; })
        .sort(function (a, b) { return b.value - a.value; });

    // Calculate the size of each arc; save the initial angles for tweening.
    partition(root);
    arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius / 2)
            .innerRadius(d => d.y0 -2)
            .outerRadius(d => d.y1 - 1);

    // Add a <g> element for each node; create the slice variable since we'll refer to this selection many times
    slice = g.selectAll('g.node')
        .data(root.descendants(), function(d) { return d.data.name; }); // .enter().append('g').attr("class", "node");
    
    newSlice = slice.enter()
        .append('g')
        .attr("class", "node")
        .merge(slice)
        .on("mouseover", mouseOverArc)
        .on("mousemove", mouseMoveArc)
        .on("mouseout", mouseOutArc);
            
    
    slice.exit().remove();

    // Append <path> elements and draw lines based on the arc calculations. Last, color the lines and the slices.
    slice.selectAll('path').remove();
    newSlice.append('path').attr("display", function (d) { return d.depth ? null : "none"; })
        .attr("d", arc)
        .style('stroke', '#fff')
        .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); });

    // Populate the <text> elements with our data-driven titles.
    slice.selectAll('text').remove();
    newSlice.append("text")
        .attr("transform", function(d) {
            return "translate(" + arc.centroid(d) + ")rotate(" + computeTextRotation(d) + ")"; })
        .attr('text-anchor', 'middle')
        .text(function(d) { return d.parent ? d.data.name : "" });
    };
    
d3.selectAll(".track").on("click", showSelectedTrack);

    // Selecting track
function showSelectedTrack(r, i) {
    //alert(this.value);
    var showNodes = JSON.parse(JSON.stringify(allNodes));

    // Determine how to size the slices.
    if (this.value === "Marketing") {
        showNodes.children.splice(3);
    } else if (this.value === "Finance") {
        showNodes.children.splice(2,1);
        showNodes.children.pop();
        showNodes.children.pop();
    } else if (this.value === "Strategy") {
        showNodes.children.splice(2,2);
        showNodes.children.pop();
    } else if (this.value === "Forensics") {
        showNodes.children.splice(2, 3);
    } else {
        showNodes;
    }
    drawSunburst(showNodes);

};

// The content of tooltips
function format_description(d) {
    var description = d.description;
    return  '<b>' + d.data.fullname + '</b></br>'+ d.data.description;
}

// Opacity changes to highlight the tooltip more
function mouseOverArc(d) {                
    tooltip.html(format_description(d));
    newSlice.style("opacity", 0.4);
    d3.select(this).transition()
        .duration(1)
        .style("opacity", 1);
    return tooltip.transition()
        .duration(0)
        .style("opacity", 0.9);
    }

function mouseOutArc(){
    newSlice.style("opacity", 1);
    d3.select(this).attr("stroke","")
    return tooltip.style("opacity", 0);
}

function mouseMoveArc (d) {
        return tooltip
            .style("top", (d3.event.pageY-10)+"px")
            .style("left", (d3.event.pageX+10)+"px");
}

// Same text rotation for different graphs
function computeTextRotation(d) {
    var angle = (d.x0 + d.x1) / Math.PI * 90;
    return (angle < 180) ? angle -90 : angle + 90;
}

update(data);
