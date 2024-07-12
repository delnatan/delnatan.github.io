// Color palette
const colorPalette = [
  '#e5b57f',
  '#e797e9',
  '#97d779',
  '#cdafeb',
  '#d9bf57',
  '#74bef1',
  '#b0d197',
  '#f19ab1',
  '#66dfb3',
  '#66d8dc'
];

// Event listeners
document.getElementById('drawButton').addEventListener('click', drawDiagram);
document.getElementById('saveButton').addEventListener('click', saveSVG);

function drawDiagram() {
  const sequence = document.getElementById('sequenceInput').value;
  const domainInput = document.getElementById('domainInput').value;
  const domains = parseDomains(domainInput);

  // Clear previous SVG
  d3.select('#diagramSvg').selectAll('*').remove();

  // Set up SVG
  const margin = { top: 40, right: 20, bottom: 60, left: 20 };
  const width = 800 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;
  const svg = d3
    .select('#diagramSvg')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // setup up scales
  const xScale = d3
    .scaleLinear()
    .domain([0, sequence.length])
    .range([0, width]);

  // draw backbone
  svg
    .append('line')
    .attr('x1', 0)
    .attr('y1', height / 2)
    .attr('x2', width)
    .attr('y2', height / 2)
    .attr('stroke', '#3d3d3d')
    .attr('stroke-width', 2);

  const smallDomains = [];

  domains.forEach((domain, index) => {
    const domainWidth = xScale(domain.end) - xScale(domain.start);
    const domainHeight = 30;
    const y = height / 2 - domainHeight / 2;

    if (domain.type === 'line') {
      const lineY = height / 2 - 25;
      const capHeight = 10;
      createProteinLine(svg, domain, index, lineY, capHeight, xScale);
    } else {
      createProteinDomain(
        svg,
        xScale(domain.start),
        y,
        domainWidth,
        domainHeight,
        domain.color || colorPalette[index % colorPalette.length]
      );

      const textWidth = getTextWidth(domain.name, '13 px sans-serif');
      const boxWidth = xScale(domain.end) - xScale(domain.start);

      // check text width against box width
      if (boxWidth > textWidth + 10) {
        // domain label
        const label = svg
          .append('text')
          .attr('x', xScale(domain.start) + domainWidth / 2)
          .attr('y', y + domainHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '13px')
          .text(domain.name);
      } else {
        // handle small domains separately
        smallDomains.push({
          name: domain.name,
          x: xScale(domain.start) + boxWidth / 2,
          y: y,
          color: domain.color || colorPalette[index % colorPalette.length]
        });
      }
    }

    const annotationSpacing = 12;

    svg
      .selectAll('.small-domain-annotation')
      .data(smallDomains)
      .enter()
      .append('g')
      .attr('class', 'small-domain-annotation')
      .each(function (d, i) {
        const g = d3.select(this);
        const annotationY = height / 1.4 + 2 + i * annotationSpacing;

        g.append('line')
          .attr('x1', d.x)
          .attr('y1', d.y + domainHeight / 2)
          .attr('x2', d.x)
          .attr('y2', annotationY)
          .attr('stroke', d.color)
          .attr('stroke-width', 1);

        g.append('text')
          .attr('x', d.x)
          .attr('y', annotationY + 10)
          .attr('text-anchor', 'middle')
          .attr('fill', d.color)
          .attr('font-size', '13px')
          .text(d.name);
      });
  });

  // add axis
  const xAxis = d3.axisBottom(xScale);
  svg
    .append('g')
    .attr('transform', `translate(0, ${height * 1.05})`)
    .call(xAxis);

  // Show save button
  document.getElementById('saveButton').style.display = 'inline-block';
}

function createProteinDomain(svg, x, y, width, height, color) {
  const g = svg.append('g').attr('transform', `translate(${x}, ${y})`);

  // Shadow
  const shadowOffset = 1.25;
  const cornerRadius = 4;

  // Main body
  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('rx', cornerRadius)
    .attr('ry', cornerRadius)
    .attr('fill', color)
    .attr('stroke', d3.color(color).darker(0.5))
    .attr('stroke-width', 1.5)
    .style('filter', 'url(#drop-shadow)');

  // Define drop shadow filter
  const filter = g
    .append('defs')
    .append('filter')
    .attr('id', 'drop-shadow')
    .attr('height', '130%');

  filter
    .append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', 1.75)
    .attr('result', 'blur');

  filter
    .append('feOffset')
    .attr('in', 'blur')
    .attr('dx', shadowOffset)
    .attr('dy', shadowOffset)
    .attr('result', 'offsetBlur');

  const feMerge = filter.append('feMerge');
  feMerge.append('feMergeNode').attr('in', 'offsetBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // highlight effect
  g.append('rect')
    .attr('width', width)
    .attr('height', height / 2)
    .attr('rx', cornerRadius)
    .attr('ry', cornerRadius)
    .style('fill', 'rgba(255, 255, 255, 0.2)');

  return g;
}

function createProteinLine(svg, domain, index, lineY, capHeight, xScale) {
  const g = svg.append('g');
  const boxWidth = xScale(domain.end) - xScale(domain.start);

  // Draw horizontal line annotation
  g.append('line')
    .attr('x1', xScale(domain.start))
    .attr('y1', lineY)
    .attr('x2', xScale(domain.end))
    .attr('y2', lineY)
    .attr('stroke', domain.color || colorPalette[index % colorPalette.length])
    .attr('stroke-width', 2);

  // Draw left cap
  g.append('line')
    .attr('x1', xScale(domain.start))
    .attr('y1', lineY - capHeight / 2)
    .attr('x2', xScale(domain.start))
    .attr('y2', lineY + capHeight / 2)
    .attr('stroke', domain.color || colorPalette[index % colorPalette.length])
    .attr('stroke-width', 2);

  // Draw right cap
  g.append('line')
    .attr('x1', xScale(domain.end))
    .attr('y1', lineY - capHeight / 2)
    .attr('x2', xScale(domain.end))
    .attr('y2', lineY + capHeight / 2)
    .attr('stroke', domain.color || colorPalette[index % colorPalette.length])
    .attr('stroke-width', 2);

  // Add text above the line
  g.append('text')
    .attr('x', xScale(domain.start) + boxWidth / 2)
    .attr('y', lineY - 15)
    .attr('text-anchor', 'middle')
    .attr('fill', domain.color || colorPalette[index % colorPalette.length])
    .attr('font-size', '13px')
    .text(domain.name);

  return g;
}

// function to parse protein annotation
// annotation can have types: 'box', 'line', etc
// this way we can implement graphics components later to go with different
// annotation types
function parseDomains(input) {
  return input
    .split('\n')
    .map((line) => {
      const [name, start, end, color, type] = line.split(',');
      return {
        name: name.trim(),
        start: parseInt(start.trim()) || 0,
        end: parseInt(end.trim()) || 0,
        color: color ? color.trim() : null,
        type: type ? type.trim() : 'box'
      };
    })
    .filter((d) => !isNaN(d.start) && !isNaN(d.end));
}

function saveSVG() {
  const svgData = document.querySelector('#diagramSvg svg');
  const svgString = new XMLSerializer().serializeToString(svgData);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'protein_sequence_diagram.svg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper function to estimate text width
// used to decide whether the annotation text is too small to fit inside
// the domain rectangle
function getTextWidth(text, font) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}
