// Color palette
const colorPalette = [
  '#3498db',
  '#e74c3c',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#d35400',
  '#34495e',
  '#16a085',
  '#c0392b'
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
  const height = 200 - margin.top - margin.bottom;

  const svg = d3
    .select('#diagramSvg')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Draw sequence line
  svg
    .append('line')
    .attr('x1', 0)
    .attr('y1', height / 2)
    .attr('x2', width)
    .attr('y2', height / 2)
    .attr('stroke', '#bdc3c7')
    .attr('stroke-width', 2);

  const smallDomains = [];

  // Set up scales
  const xScale = d3
    .scaleLinear()
    .domain([0, sequence.length])
    .range([0, width]);

  // Draw domains
  svg
    .selectAll('.domain')
    .data(domains)
    .enter()
    .append('g')
    .attr('class', 'domain')
    .each(function (d, i) {
      const g = d3.select(this);
      const boxWidth = xScale(d.end) - xScale(d.start);
      const boxHeight = 30;
      const yPos = height / 2 - boxHeight / 2;

      console.log(d);

      if (d.type === 'line') {
        const lineY = height / 2 - 25;
        const capHeight = 10;

        // Draw horizontal line annotation
        g.append('line')
          .attr('x1', xScale(d.start))
          .attr('y1', lineY)
          .attr('x2', xScale(d.end))
          .attr('y2', lineY)
          .attr('stroke', d.color || colorPalette[i % colorPalette.length])
          .attr('stroke-width', 2);

        // Draw left cap
        g.append('line')
          .attr('x1', xScale(d.start))
          .attr('y1', lineY - capHeight / 2)
          .attr('x2', xScale(d.start))
          .attr('y2', lineY + capHeight / 2)
          .attr('stroke', d.color || colorPalette[i % colorPalette.length])
          .attr('stroke-width', 2);

        // Draw right cap
        g.append('line')
          .attr('x1', xScale(d.end))
          .attr('y1', lineY - capHeight / 2)
          .attr('x2', xScale(d.end))
          .attr('y2', lineY + capHeight / 2)
          .attr('stroke', d.color || colorPalette[i % colorPalette.length])
          .attr('stroke-width', 2);
        // Add text above the line
        g.append('text')
          .attr('x', xScale(d.start) + boxWidth / 2)
          .attr('y', lineY - 15)
          .attr('text-anchor', 'middle')
          .attr('fill', d.color || colorPalette[i % colorPalette.length])
          .attr('font-size', '10px')
          .text(d.name);
      } else {
        // Add shadow for box-style domain
        g.append('rect')
          .attr('x', xScale(d.start) + 1)
          .attr('y', yPos + 1)
          .attr('width', boxWidth)
          .attr('height', boxHeight)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('fill', 'rgba(0,0,0,0.2)')
          .attr('filter', 'url(#drop-shadow)');

        // Add main box
        g.append('rect')
          .attr('x', xScale(d.start))
          .attr('y', yPos)
          .attr('width', boxWidth)
          .attr('height', boxHeight)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('fill', d.color || colorPalette[i % colorPalette.length]);

        // check if text fits in box
        const textWidth = getTextWidth(d.name, '12 px sans-serif');
        if (boxWidth > textWidth + 10) {
          // Add text
          g.append('text')
            .attr('x', xScale(d.start) + boxWidth / 2)
            .attr('y', height / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '12px')
            .text(d.name);
        } else {
          smallDomains.push({
            name: d.name,
            x: xScale(d.start) + boxWidth / 2,
            y: yPos + boxHeight,
            color: d.color || colorPalette[i % colorPalette.length]
          });
        }
      }
    });

  const annotationSpacing = 10;

  svg
    .selectAll('.small-domain-annotation')
    .data(smallDomains)
    .enter()
    .append('g')
    .attr('class', 'small-domain-annotation')
    .each(function (d, i) {
      const g = d3.select(this);
      const annotationY = height + 5 + i * annotationSpacing;

      // Draw vertical connection line
      g.append('line')
        .attr('x1', d.x)
        .attr('y1', d.y)
        .attr('x2', d.x)
        .attr('y2', annotationY - 5)
        .attr('stroke', d.color)
        .attr('stroke-width', 1);

      // Add text
      g.append('text')
        .attr('x', d.x)
        .attr('y', annotationY + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', d.color)
        .attr('font-size', '12px')
        .text(d.name);
    });

  // Add drop shadow filter
  const defs = svg.append('defs');
  const filter = defs
    .append('filter')
    .attr('id', 'drop-shadow')
    .attr('height', '130%');

  filter
    .append('feGaussianBlur')
    .attr('in', 'SourceAlpha')
    .attr('stdDeviation', 2.2) // Reduced from 3
    .attr('result', 'blur');

  filter
    .append('feOffset')
    .attr('in', 'blur')
    .attr('dx', 1.25) // Reduced from 2
    .attr('dy', 1.25) // Reduced from 2
    .attr('result', 'offsetBlur');

  const feMerge = filter.append('feMerge');

  // Add a feFlood for controlling opacity
  filter
    .append('feFlood')
    .attr('flood-color', 'rgba(0,0,0,1.0)') // Reduced opacity
    .attr('flood-opacity', 1.0)
    .attr('result', 'offsetColor');

  filter
    .append('feComposite')
    .attr('in', 'offsetColor')
    .attr('in2', 'offsetBlur')
    .attr('operator', 'in')
    .attr('result', 'offsetBlur');

  feMerge.append('feMergeNode').attr('in', 'offsetBlur');
  feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

  // Show save button
  document.getElementById('saveButton').style.display = 'inline-block';
}

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
function getTextWidth(text, font) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  return context.measureText(text).width;
}
