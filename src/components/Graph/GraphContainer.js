import React, { Component, Fragment } from 'react';
import Graph from '../Graph/Graph';
import Axis from './Axis';
import ThresholdLabel from '../Graph/ThresholdLabel';
import { scaleLinear, scaleUtc } from 'd3-scale';
import { max, extent } from 'd3-array';
import { margin } from '../../utils/constants';


class GraphContainer extends Component {
  constructor(props) {
      super(props);
      this.state = {
          children: [],
          scales: {},
          scaleDomains: false,
          graphWidth: 0
      }
  }

  componentDidMount() {
    //   console.log('ComponentDidMount')
      const { width, height, seriesList, dates, scenarioList } = this.props;
      if (seriesList.length > 0) {
        const graphWidth = scenarioList.length === 2 ? width / 2 : width;
        const scales = this.getScales(seriesList, dates, graphWidth, height);
        const child = {
            'key': scenarioList[0].key,
            'graph': [],
        }
        
        child.graph.push(
            <Graph
                key={`${scenarioList[0].key}_Graph_${this.props.scenarioClickCounter}`}
                keyVal={`${scenarioList[0].key}_Graph_${this.props.scenarioClickCounter}`}
                stat={this.props.stat}
                geoid={this.props.geoid}
                scenario={this.props.scenario}
                severity={this.props.severity}
                r0={this.props.r0}
                simNum={this.props.simNum}
                showConfBounds={this.props.showConfBounds}
                showActual={this.props.showActual}
                series={this.props.seriesList[0]}
                dates={this.props.dates}
                statThreshold={this.props.statThreshold}
                dateThreshold={this.props.dateThreshold}
                dateRange={this.props.dateRange}
                width={graphWidth}
                height={this.props.height}
                x={0}
                y={0}
                xScale={scales.xScale}
                yScale={scales.yScale}
            />
        )
        // console.log(child)
        this.setState({
            scales,
            children: [child],
            scaleDomains: true,
            graphWidth
        })
      }
  }

  componentDidUpdate(prevProp, prevState) {

      const { scenarioList, seriesList, dates, height } = this.props;
      const newChildren = [];
    
      // technically both scenarioList and seriesList need to update
      // but seriesList is updated later so using it to enter componentDidUpdate
      // scenarioList updates happen then are immediately followed by seriesList update so can't rely on scenarioList check
      // if the seriesList has changed, we want to remove existing graphs before drawing / updating
      // the way to solve this is by keeping track of scenarioChange click events and putting those in the graph keys
      // so that when the click events increment the keys change and the graph component remounts
      if (prevProp.seriesList !== this.props.seriesList) {
            // console.log('seriesList change, seriesList is', seriesList.length)
            const graphWidth = scenarioList.length === 2 ? this.props.width / 2 : this.props.width;
            // console.log('graphWidth is', graphWidth)
            // need to adjust scale by length of scenario list
            // break these out into X and Y (X out of the loop, Y in?)
            const scales = this.getScales(seriesList, dates, graphWidth, height);

            // console.log('componentDidUpdate Series List - scenarioList change');
            const scenarioChange = true;
            for (let i = 0; i < scenarioList.length; i++) {
                const child = {
                    'key': scenarioList[i].key,
                    'graph': [],
                }
                child.graph.push(
                    <Graph
                        key={`${scenarioList[i].key}_Graph_${this.props.scenarioClickCounter}`}
                        keyVal={`${scenarioList[i].key}_Graph_${this.props.scenarioClickCounter}`}
                        stat={this.props.stat}
                        geoid={this.props.geoid}
                        scenario={this.props.scenarioList[i]}
                        severity={this.props.severity}
                        r0={this.props.r0}
                        simNum={this.props.simNum}
                        showConfBounds={this.props.showConfBounds}
                        showActual={this.props.showActual}
                        series={this.props.seriesList[i]}
                        dates={this.props.dates}
                        statThreshold={this.props.statThreshold}
                        dateThreshold={this.props.dateThreshold}
                        dateRange={this.props.dateRange}
                        brushActive={this.props.brushActive}
                        width={graphWidth}
                        height={this.props.height}
                        x={i * graphWidth}
                        y={0}
                        xScale={scales.xScale}
                        yScale={scales.yScale}
                    />
                )
                newChildren.push(child);
            }
            this.setState({
                scales,
                graphWidth,
                children: newChildren,
            })        
        }
  }

  getScales = (seriesList, dates, width, height) => {
      // calculate scale domains
      const timeDomain = extent(dates);
      let scaleMaxVal = 0
      for (let i = 0; i < seriesList.length; i++) {
          const seriesMaxVal = max(seriesList[i], sims => max(sims.vals));
          if (seriesMaxVal > scaleMaxVal) scaleMaxVal = seriesMaxVal
      }
      // set scale ranges to width and height of container
      const xScale = scaleUtc().range([margin.left, width - margin.right])
                               .domain(timeDomain);
      const yScale = scaleLinear().range([height - margin.bottom, margin.top])
                                  .domain([0, scaleMaxVal]).nice();

      return { xScale, yScale }
  }

  render() {
      const { children } = this.state;
      const scenarioTitleList = this.props.scenarioList.map( scenario => {
        return scenario.name.replace('_', ' ');
    })
    //   const { scenarioList, width } = this.props;
    //   const adjWidth = scenarioList.length === 2 ? width / 2 : width;
      return (
               
          <div className="graph-wrapper">
              <div className="col-1"></div>
              <div className="y-axis-label titleNarrow">
                  {this.props.yAxisLabel}
              </div>
              <div className="resetRow graph-title-row">
                <div style={{ width: margin.yAxis + margin.left, height: 40}}></div>
                {scenarioTitleList.map((scenarioTitle, i) => {
                    return (this.props.scenarioList && scenarioTitleList.length > 1) ? 
                            <div style={{ width: this.props.width - margin.right}}>
                                <p className="scenario-title titleNarrow">
                                    {scenarioTitle}
                                </p>
                            </div>
                         :
                            <div style={{ width: this.props.width - margin.right}}>
                                <p className="scenario-title titleNarrow">
                                    {scenarioTitle}
                                </p>
                            </div>
                } )}
            </div>
              <div className="resetRow graph-title-row callout-row">
                <div style={{ width: margin.yAxis + margin.left, height: 40}}></div>
                    {children.map( (child, i) => {
                        return (
                            (this.props.scenarioList && this.props.scenarioList.length === 2) ?
                                <ThresholdLabel
                                    key={`${child.key}-label`}
                                    classProps={'filter-label threshold-label callout'}
                                    statThreshold={this.props.statThreshold}
                                    dateThreshold={this.props.dateThreshold}
                                    percExceedence={this.props.percExceedenceList[i]}
                                    label={this.props.stat.name.toLowerCase()}
                                />
                            :

                                <ThresholdLabel
                                    key={`${child.key}-label`}
                                    classProps={'filter-label threshold-label callout'}
                                    statThreshold={this.props.statThreshold}
                                    dateThreshold={this.props.dateThreshold}
                                    percExceedence={this.props.percExceedenceList[i]}
                                    label={this.props.stat.name.toLowerCase()}
                                />
                        )
                    })}
                </div>
                <div className="row resetRow">
                  {this.state.scaleDomains &&
                  <Fragment>
                        <svg 
                            width={margin.yAxis}
                            height={this.props.height} 
                        >
                        <Axis 
                            width={this.state.graphWidth}
                            height={this.props.height}
                            orientation={'left'}
                            scale={this.state.scales.yScale}
                            x={margin.yAxis}
                            y={0}
                        />
                        </svg>
                        <svg 
                            width={this.props.width}
                            height={this.props.height} 
                        >
                        {children.map(child => {
                            return (
                                <g key={`${child.key}-graph`}>
                                    {child.graph}
                                </g>
                            )
                            
                        })}
                    </svg>
                </Fragment>
                }
                </div>
          </div>
      )
  }
}

export default GraphContainer;