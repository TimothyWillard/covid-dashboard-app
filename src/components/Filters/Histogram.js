import React, { useEffect, useState } from 'react';
import { bin, max, range } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { colors } from '../../utils/colors.js';

export default function Histogram({ allSims, selectedSims, sortedSims, selected, r0min, r0max, height, step }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(document.querySelector('.r0-slider').clientWidth);
    window.addEventListener('resize', (e) => {
      const width = document.querySelector('.r0-slider').clientWidth;
      setWidth(width);
    });
    return () => {
      window.removeEventListener('resize', (e) => {
        const width = document.querySelector('.r0-slider').clientWidth;
        setWidth(width);
      });
    };
  }, []);

  const sorted_selected_sims = selectedSims.slice().sort((a, b) => a.r0 - b.r0);
  const xScale = scaleLinear().domain([r0min, r0max]).range([0, width]).nice();
  const yScale = scaleLinear().range([height, 1]);
  const thresholds = range(r0min, r0max, step);

  const binGenerator = bin()
    .value(d => d.r0)
    .domain(xScale.domain())
    .thresholds(thresholds);

  let bins = [];
  let selectedBins = [];
  if (sortedSims !== undefined) {
    bins = binGenerator(sortedSims);
    selectedBins = binGenerator(sorted_selected_sims);
    yScale.domain([0, max(bins, d => d.length)]);
  }

  return (
    <div>
      {width && xScale &&
        <svg width={width} height={height}>
          <g>
            {bins.map((b, i) => {
              return (
                <rect
                  key={`hist-${i}`}
                  x={xScale(b.x0)}
                  y={yScale(b.length)}
                  width={xScale(b.x1) - xScale(b.x0)}
                  height={height - yScale(b.length)}
                  fill="#ffffff"
                  stroke={colors.chartBkgd}
                >
                </rect>
              )
            })}
          </g>
          <g>
            {selectedBins.map((b, i) => {
              return (
                <rect
                  key={`hist-${i}`}
                  x={xScale(b.x0)}
                  y={yScale(b.length)}
                  width={xScale(b.x1) - xScale(b.x0)}
                  height={height - yScale(b.length)}
                  fill={colors.sliderBlue}
                  stroke={colors.chartBkgd}
                >
                </rect>
              )
            })}
          </g>
        </svg>
      }
    </div>
  );
};
