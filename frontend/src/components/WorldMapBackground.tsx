import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

export const WorldMapBackground = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Load world topology
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(topology => {
        const countries = feature(topology, topology.objects.countries);
        
        const width = 1200;
        const height = 600;
        
        const projection = d3.geoMercator()
          .scale(180)
          .center([0, 20])
          .translate([width / 2, height / 2]);
        
        const path = d3.geoPath().projection(projection);
        
        const svgElement = d3.select(svg);
        svgElement.selectAll('*').remove();
        
        svgElement
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', `0 0 ${width} ${height}`)
          .attr('preserveAspectRatio', 'xMidYMid meet');
        
        // Add countries
        svgElement.selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', 'rgba(255, 255, 255, 0.1)')
          .attr('stroke', 'rgba(255, 255, 255, 0.2)')
          .attr('stroke-width', 0.5)
          .style('opacity', 0.6);
        
        setMapLoaded(true);
      })
      .catch(err => {
        console.error('Failed to load world map:', err);
      });
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        ref={svgRef}
        className="w-full h-full opacity-30"
        style={{
          filter: 'blur(1px)',
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      />
    </div>
  );
};