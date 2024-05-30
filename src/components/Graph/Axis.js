import React, { useEffect, useRef, forwardRef } from 'react'
import { axisLeft, axisBottom, axisRight } from 'd3-axis'
import { timeFormat } from 'd3-time-format'
import { select } from 'd3-selection'
import PropTypes from 'prop-types';

import { addCommas, formatTitle } from '../../utils/utils.js'
import { monthDateFormat } from '../../utils/constants'

// eslint-disable-next-line no-unused-vars
const Axis = forwardRef(({ scale, tickNum, orientation, view, width, x, y }, ref) => {
  // const [ axis, setAxis ] = useState(null);
  const axisRef = useRef(null);
  const axisElementRef = useRef(null);

  useEffect(() => {
    // let a;
    if (orientation === 'left') {
      axisRef.current = axisLeft()
        .scale(scale)
        .ticks(tickNum ? tickNum : 10)
        .tickFormat(d => addCommas(d));
      if (axisElementRef.current) {
        select(axisElementRef.current)
          .call(axisRef.current);
      }
    } else if (orientation === 'right') {
      axisRef.current = axisRight()
        .scale(scale)
        .tickFormat(d => addCommas(d));
      if (axisElementRef.current) {
        select(axisElementRef.current)
          .call(axisRef.current);
      }
    } else {
      if (view === 'graph') {
        axisRef.current = axisBottom()
          .scale(scale)
          .tickFormat(timeFormat(monthDateFormat))
          .ticks(width / 80)
          .tickSizeOuter(0);
      } else if (view === 'chart') {
        axisRef.current = axisBottom()
          .scale(scale)
          .tickFormat(d => formatTitle(d))
          .ticks(width / 80)
          .tickSizeOuter(0);
      } else {
        axisRef.current = axisBottom()
          .scale(scale)
          .ticks(width / 80)
          .tickSizeOuter(0);
      }
      if (axisElementRef.current) {
          if (view === 'chart') {
            select(axisElementRef.current)
              .call(axisRef.current)
              .call(g => g.select(".domain").remove())
              .call(g => g.selectAll("text").attr("dy", "2em"));
          } else {
            select(axisElementRef.current)
              .call(axisRef.current)
              .call(g => g.select(".domain").remove());
          }
      }
    }
    return () => {};
  }, [ scale, tickNum, orientation, view, width ]);

  useEffect(() => {
    if (axisRef.current && axisElementRef.current) {
      const axisNode = select(axisElementRef.current);
      axisRef.current.scale(scale);
      if (orientation === 'left') {
        // update y axis
        axisNode
          .transition()
          .duration(1000)
          .call(axisRef.current)
          .call(g => g.select(".domain").remove());
      } else {
        // update x axis
          axisNode
            .transition()
            .duration(1000)
            .call(axisRef.current);
      }
      if (view !== 'graph') {
        select(axisElementRef.current)
          .call(axisRef.current)
          .call(g => g.select(".domain").remove());
      }
      if (view === 'chart') {
        select(axisElementRef.current)
          .call(axisRef.current)
          .call(g => g.selectAll("text")
          .attr("dy", "2em"));
      }
    }
    return () => {};
  }, [ axisRef, axisElementRef, orientation, scale, view ]);

  return <g ref={axisElementRef} transform={`translate(${x}, ${y})`} />;
});

Axis.displayName = 'Axis';

Axis.propTypes = {
  scale: PropTypes.func,
  tickNum: PropTypes.number,
  orientation: PropTypes.string,
  view: PropTypes.string,
  width: PropTypes.number,
  x: PropTypes.number,
  y: PropTypes.number,
};

export default Axis;
