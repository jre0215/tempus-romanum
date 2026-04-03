import "bulma/css/bulma.css";
import "./style.css";

import moment from "moment";

import { drawChart } from "./chart.ts";

const sunriseInput = document.getElementById("sunrise") as HTMLInputElement;
const sunsetInput = document.getElementById("sunset") as HTMLInputElement;
const updateButton = document.getElementById("update") as HTMLButtonElement;

function updateChart() {
    const sunriseTime = moment(sunriseInput.value, ["HH:mm"]);
    const sunsetTime = moment(sunsetInput.value, ["HH:mm"]);
    drawChart(sunriseTime, sunsetTime);
}

updateButton.addEventListener("click", updateChart);

updateChart();
