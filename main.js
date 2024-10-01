const chartDom = document.getElementById("chart");
const chart = echarts.init(chartDom, { renderer: "svg" });

const btnSelector = document.getElementById("selector");
const btnTime = document.getElementById("time");
const btnTest = document.getElementById("test");
let selector = false;
let actTime = false;

const showFileNames = document.getElementById("files");

const chartConfig = document.getElementById("chart-axis");

const points = 200;

let chartDataObject = null;

function createRadioElement(name, checked) {
  var radioHtml = '<input type="radio" text="' + name + '" name="' + name + '"';
  if (checked) {
    radioHtml += ' checked="checked"';
  }
  radioHtml += "/>";

  var radioFragment = document.createElement("div");
  radioFragment.innerHTML = radioHtml;

  return radioFragment.firstChild;
}

let demoChart = [
  {
    legend: ["Time"],
    series: [
      {
        name: "Sine Wave",
        type: "line",
        data: genSine(points).dataY,
        showSymbol: false,
        lineStyle: { color: "" },
        itemStyle: { color: "" },
      },
    ],
    xAxis: [
      {
        type: "category",
        data: genSine(points).dataX,
      },
    ],
    yAxis: [
      {
        type: "value",
        axisLine: {
          show: true,
        },
      },
    ],
    color: ["#5470c6"],
  },
];

displayChart(demoChart);

function flipAxis(number, id) {
  const name = id;
  let btn = document.getElementById(id);
  const actValue = chartDataObject[0].series[number].yAxisIndex;

  if (actValue == 0) {
    chartDataObject[0].series[number].yAxisIndex = 1;
    btn.innerHTML = `${name} >>`;
  } else {
    btn.innerHTML = `<< ${name}`;
    chartDataObject[0].series[number].yAxisIndex = 0;
  }

  displayChart(chartDataObject);
}

function genSine(points) {
  const dataY = [];
  const dataX = [];
  for (let i = 0; i < points; i++) {
    const x = i / 10;
    dataX.push(x.toFixed(1));
    dataY.push(Math.sin(x));
  }
  return { dataX, dataY };
}

async function process(actualTime = false) {
  const fileInput = document.getElementById("fileInput");
  const filenames = [];
  const chartData = [];

  const timeStamp = new Date();
  if (!actualTime) {
  }

  let files = Array.from(fileInput.files).map((file) => {
    const filename = file.name.split(".")[0];
    filenames.push(filename);
    let reader = new FileReader();

    return new Promise((resolve) => {
      reader.onload = () => resolve(reader.result);
      reader.readAsText(file);
    });
  });

  // filenames.forEach((file) => {
  //   const filename = document.createElement("p");
  //   filename.innerHTML = file;
  //   showFileNames.appendChild(filename);
  //   console.log("He", filename);
  // });

  let res = await Promise.all(files);

  for (let i = 0; i < res.length; i++) {
    if (res.length > 1) {
      chartData.push(makeChart(parseTrace(res[i], actualTime, filenames[i], timeStamp)));
    } else {
      chartData.push(makeChart(parseTrace(res[i], actualTime)));
    }
  }
  chartDataObject = chartData;
  const series = chartDataObject[0].series;
  for (let i = 0; i < series.length; i++) {
    var _button = document.createElement("button");
    _button.data = series[i].name;
    _button.className = "btn";
    _button.innerHTML = `<< ${series[i].name}`;
    _button.id = series[i].name;
    _button.onclick = function () {
      flipAxis(i, series[i].name);
    };
    chartConfig.appendChild(_button);
  }
  displayChart(chartData);
}

window.addEventListener("resize", function () {
  chart.resize();
});

btnTime.addEventListener("click", function () {
  actTime = !actTime;
  if (!actTime) {
    btnTime.value = "Actual time";
    btnTime.style.backgroundColor = "#CCC6C5";
    process(actTime);
  } else {
    btnTime.value = "Current time";
    btnTime.style.backgroundColor = "#f0f0f0";
    process(actTime);
  }
});

btnSelector.addEventListener("click", function () {
  selector = !selector;
  if (!selector) {
    btnSelector.value = "Unselect all";
    btnSelector.style.backgroundColor = "#CCC6C5";
    chart.dispatchAction({
      type: "legendAllSelect",
    });
  } else {
    btnSelector.value = "Select all";
    btnSelector.style.backgroundColor = "#f0f0f0";
    chart.dispatchAction({
      type: "legendInverseSelect",
    });
  }
});

// btnTest.addEventListener("click", function () {
//   console.log("Hej cllick", chartDataObject);
//   chartDataObject[0].series[2].yAxisIndex = 2;
//   displayChart(chartDataObject);
// });
