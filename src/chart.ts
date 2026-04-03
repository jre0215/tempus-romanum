import * as d3 from "d3";
import moment from "moment";

import { getTimeData, type TimeData } from "./time.ts";

const chartContainer = document.getElementById("chart-container") as HTMLDivElement;

const SVG_SIZE = 600;
const HOUR_TICK_LABEL_RADIUS: number = SVG_SIZE * 0.25;
const HOUR_ARC_INNER_RADIUS: number = SVG_SIZE * 0.30;
const HOUR_ARC_OUTER_RADIUS: number = SVG_SIZE * 0.40;
const VIGIL_ARC_INNER_RADIUS: number = SVG_SIZE * 0.405;
const VIGIL_ARC_OUTER_RADIUS: number = SVG_SIZE * 0.445;
const QUARTER_ARC_INNER_RADIUS: number = SVG_SIZE * 0.45;
const QUARTER_ARC_OUTER_RADIUS: number = SVG_SIZE * 0.50;

const ORDINALS: string[] = [
    "prīma",
    "secunda",
    "tertia",
    "quārta",
    "quīnta",
    "sexta",
    "septima",
    "octāva",
    "nōna",
    "decima",
    "ūndecima",
    "duodecima",
];

const hourArc = d3.arc()
    .innerRadius(HOUR_ARC_INNER_RADIUS)
    .outerRadius(HOUR_ARC_OUTER_RADIUS)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle)
    .padAngle(0.01);

const vigilArc = d3.arc()
    .innerRadius(VIGIL_ARC_INNER_RADIUS)
    .outerRadius(VIGIL_ARC_OUTER_RADIUS)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle)
    .padAngle(0.01);

const quarterArc = d3.arc()
    .innerRadius(QUARTER_ARC_INNER_RADIUS)
    .outerRadius(QUARTER_ARC_OUTER_RADIUS)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle)
    .padAngle(0.01);

const hourScale = d3.scaleLinear()
    .domain([0, 23])
    .range([0, 345]);

export function drawChart(sunriseMoment: moment.Moment, sunsetMoment: moment.Moment): void {
    const timeData: TimeData = getTimeData(sunriseMoment, sunsetMoment);

    d3.select("#chart").selectAll("*").remove();

    const svg = d3.select("#chart")
        .append("g")
        .attr("transform", `translate(${SVG_SIZE / 2}, ${SVG_SIZE / 2})`);

    svg.selectAll(".hour-arc")
        .data(timeData.hours)
        .enter()
        .append("path")
        .attr("class", (d) => d.isDaytime ? "hour-day" : "hour-night")
        .attr("id", (_d, i) => `hour-arc${i}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", hourArc as any)
        .each(function (d, i) {
            // Captures everything up to the first L
            const firstArcSection = /(^.+?)L/;

            // Extract the arc statement
            let newArc: string = firstArcSection.exec(d3.select(this).attr("d"))![1];
            newArc = newArc.replace(/,/g, " ");

            // Flip the start and end positions for daytime hours
            // so that the text appears rightside up
            if (d.isDaytime) {
                // Capture everything between the capital M and first capital A
                const startLocator = /M(.*?)A/;
                // Capture everything between the capital A and 0 0 1
                const middleLocator = /A(.*?)0 [0-1] 1/;
                // Capture everything between the 0 0 1 and the end of the string
                const endLocator = /0 [0-1] 1 (.*?)$/;
                // Flip the direction of the arc by switching the start and end
                // point and using a 0 (instead of 1) sweep flag
                const newStart: string = endLocator.exec(newArc)![1];
                const newEnd: string = startLocator.exec(newArc)![1];
                const middleSec: string = middleLocator.exec(newArc)![1];

                // Build up the new arc notation and set the sweep flag to 0
                newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
            }

            // Create a new invisible arc that the text can flow along
            svg.append("path")
                .attr("class", "hidden-hour-arc")
                .attr("id", `hidden-hour-arc${i}`)
                .attr("d", newArc)
                .style("fill", "none");
        })
        .append("svg:title")
        .text((d, i) => `${d.isDaytime ? "diēī" : "noctis"} hōra ${ORDINALS[i % 12]}`);

    svg.selectAll(".hour-label")
        .data(timeData.hours)
        .enter().append("text")
        .attr("class", "hour-label")
        // Move the labels below the arcs for daytime hours so that the text appears
        // rightside up
        .attr("dy", (d) => {
            if (d.isDaytime) {
                return (-(((HOUR_ARC_OUTER_RADIUS - HOUR_ARC_INNER_RADIUS) / 2) - 6));
            } else {
                return (((HOUR_ARC_OUTER_RADIUS - HOUR_ARC_INNER_RADIUS) / 2) + 4);
            }
        })
        .append("textPath")
        .attr("startOffset", "50%")
        .style("text-anchor", "middle")
        .attr("xlink:href", (_d, i) => `#hidden-hour-arc${i}`)
        .text((d) => d.label)
        .append("svg:title")
        .text((d, i) => `${d.isDaytime ? "diēī" : "noctis"} hōra ${ORDINALS[i % 12]}`);

    svg.selectAll(".hour-tick")
        .data(d3.range(24))
        .enter()
        .append("line")
        .attr("id", (_d, i) => `hour-tick${i}`)
        .attr("class", "hour-tick")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", HOUR_ARC_INNER_RADIUS * 0.925)
        .attr("y2", HOUR_ARC_INNER_RADIUS * 0.95)
        .attr("transform", (d: number) => `rotate(${hourScale(d)})`);

    svg.selectAll(".hour-tick-label")
        .data(d3.range(24))
        .enter()
        .append("text")
        .attr("id", (_d, i) => `hour-tick-label${i}`)
        .attr("text-anchor", "middle")
        .attr("x", (d) => {
            return HOUR_TICK_LABEL_RADIUS * Math.sin(hourScale(d)! * (Math.PI / 180));
        })
        .attr("y", (d) => {
            return (-HOUR_TICK_LABEL_RADIUS) * Math.cos(hourScale(d)! * (Math.PI / 180)) + 4;
        })
        .text((d: number) => d === 0 ? 24 : d);

    svg.selectAll(".vigil-arc")
        .data(timeData.vigils)
        .enter()
        .append("path")
        .attr("class", "hour-night")
        .attr("id", (_d, i) => `vigil-arc${i}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", vigilArc as any)
        .each(function (_d, i) {
            // Captures everything up to the first L
            const firstArcSection = /(^.+?)L/;

            // Extract the arc statement
            let newArc: string = firstArcSection.exec(d3.select(this).attr("d"))![1];
            newArc = newArc.replace(/,/g, " ");

            // Create a new invisible arc that the text can flow along
            svg.append("path")
                .attr("class", "hidden-vigil-arc")
                .attr("id", `hidden-vigil-arc${i}`)
                .attr("d", newArc)
                .style("fill", "none");
        })
        .append("svg:title")
        .text((_d, i) => `vigilia ${ORDINALS[i]}`);

    svg.selectAll(".vigil-label")
        .data(timeData.vigils)
        .enter().append("text")
        .attr("class", "vigil-label")
        .attr("dy", ((VIGIL_ARC_OUTER_RADIUS - VIGIL_ARC_INNER_RADIUS) / 2) + 4)
        .append("textPath")
        .attr("startOffset", "50%")
        .style("text-anchor", "middle")
        .attr("xlink:href", (_d, i) => `#hidden-vigil-arc${i}`)
        .text((d) => d.label)
        .append("svg:title")
        .text((_d, i) => `vigilia ${ORDINALS[i]}`);

    svg.selectAll(".quarter-arc")
        .data(timeData.quarters)
        .enter()
        .append("path")
        .attr("id", (_d, i) => `quarter-arc${i}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr("d", quarterArc as any)
        .style("fill", "none")
        .each(function (d, i) {
            // Captures everything up to the first L
            const firstArcSection = /(^.+?)L/;

            // Extract the arc statement
            let newArc = firstArcSection.exec(d3.select(this).attr("d"))![1];
            newArc = newArc.replace(/,/g, " ");

            // Flip the start and end positions for daytime hours
            // so that the text appears rightside up
            const averageAngle = (d.startAngle + d.endAngle) / 2;
            if (averageAngle > (Math.PI / 2) && averageAngle < (Math.PI * 1.5)) {
                // Capture everything between the capital M and first capital A
                const startLocator = /M(.*?)A/;
                // Capture everything between the capital A and 0 0 1
                const middleLocator = /A(.*?)0 [0-1] 1/;
                // Capture everything between the 0 0 1 and the end of the string
                const endLocator = /0 [0-1] 1 (.*?)$/;
                // Flip the direction of the arc by switching the start and end
                // point and using a 0 (instead of 1) sweep flag
                const newStart: string = endLocator.exec(newArc)![1];
                const newEnd: string = startLocator.exec(newArc)![1];
                const middleSec: string = middleLocator.exec(newArc)![1];

                // Build up the new arc notation and set the sweep flag to 0
                newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
            }

            // Create a new invisible arc that the text can flow along
            svg.append("path")
                .attr("class", "hidden-quarter-arc")
                .attr("id", `hidden-quarter-arc${i}`)
                .attr("d", newArc)
                .style("fill", "none");
        });

    svg.selectAll(".quarter-label")
        .data(timeData.quarters)
        .enter().append("text")
        .attr("class", "quarter-label")
        .attr("dy", (d) => {
            const averageAngle: number = (d.startAngle + d.endAngle) / 2;
            if (averageAngle > (Math.PI / 2) && averageAngle < (Math.PI * 1.5)) {
                return (-(((QUARTER_ARC_OUTER_RADIUS - QUARTER_ARC_INNER_RADIUS) / 2) - 6));
            } else {
                return (((QUARTER_ARC_OUTER_RADIUS - QUARTER_ARC_INNER_RADIUS) / 2) + 4);
            }
        })
        .append("textPath")
        .attr("startOffset", "50%")
        .style("text-anchor", "middle")
        .attr("xlink:href", (_d, i) => `#hidden-quarter-arc${i}`)
        .text((d) => d.label);
}

function resizeChart() {
    const targetWidth = Math.min(chartContainer.clientWidth, SVG_SIZE);
    d3.select("#chart")
        .attr("width", targetWidth)
        .attr("height", targetWidth);
}
window.addEventListener("resize", () => resizeChart);
resizeChart();
