function makeChart(parsedTrace) {
  let chartData = {
    legend: [],
    series: [],
    xAxis: {
      type: "time",
      axisLabel: {
        formatter: {
          millisecond: "{SSS}",
        },
      },
    },
    yAxis: [
      {
        type: "value",
        axisLine: {
          show: true,
        },
      },
      {
        type: "value",
        position: "right",
        // offset: (chartData.yAxis.length - 1) * 90,
        alignTicks: true,
        axisLine: {
          show: true,
        },
      },
    ],
    color: [],
  };

  for (const key in parsedTrace) {
    const data = [];
    for (let i = 0; i < parsedTrace[key].value.length; i++) {
      data.push([parsedTrace[key].timestamp[i], parsedTrace[key].value[i]]);
    }

    chartData.legend.push(parsedTrace[key].comment);
    let side = 0;
    if (parsedTrace[key].comment == "gap1") {
      chartData.yAxis.push({
        type: "value",
        position: "right",
        offset: (chartData.yAxis.length - 1) * 90,
        alignTicks: true,
        axisLine: {
          show: true,
        },
      });
      side = chartData.yAxis.length - 1;
    }
    if (parsedTrace[key].comment == "x1force1") {
      chartData.yAxis.push({
        type: "value",
        position: "right",
        offset: (chartData.yAxis.length - 1) * 90,
        alignTicks: true,
        axisLine: {
          show: true,
        },
      });
      side = chartData.yAxis.length - 1;
    }
    // if (parsedTrace[key].comment == "Timer") {
    //   side = 2;
    // }
    let serie = {
      name: parsedTrace[key].comment,
      data: data,
      type: "line",
      yAxisIndex: side,
      showSymbol: false,
      lineStyle: { color: "" },
      itemStyle: { color: "" },
      seriesUnit: parsedTrace[key].unit,
    };
    chartData.series.push(serie);
  }

  return chartData;
}

function genColor(numColors) {
  let colors = [];
  // let step = Math.floor(16777215 / numColors);

  // for (let i = 0; i < numColors; i++) {
  //   let colorValue = step * i;
  //   let hexColor = colorValue.toString(16).padStart(6, "0");
  //   colors.push(`#${hexColor}`);
  // }

  for (let i = 0; i < numColors; i++) {
    const randomColor = "#" + Math.floor(Math.random() * 16000000).toString(16);
    colors.push(randomColor);
  }
  return colors;
}

function displayChart(chartData) {
  if (chartData.length > 1) {
    // Smusha ihop alla i arrayet till en fin sak
    const multipleChartData = [
      {
        legend: [],
        series: [],
        xAxis: chartData[0].xAxis,
      },
    ];

    for (let i = 0; i < chartData.length; i++) {
      multipleChartData[0].legend = multipleChartData[0].legend.concat(chartData[i].legend);
      multipleChartData[0].series = multipleChartData[0].series.concat(chartData[i].series);
    }
    chartData = multipleChartData;
  }

  const color = genColor(chartData[0].legend.length);
  // const nameNums = [];

  // for (let k = 0; k < chartData[0].legend.length; k++) {
  //   let name = chartData[0].legend[k].split("");
  //   let num = 0;
  //   name.forEach((char) => {
  //     num += char.charCodeAt(0);
  //   });
  //   nameNums.push(num);
  // }

  for (let j = 0; j < color.length; j++) {
    chartData[0].series[j].lineStyle.color = color[j];
    chartData[0].series[j].itemStyle.color = color[j];
  }

  const option = {
    legend: {
      type: "plain",
      orient: "horizontal",
      // right: "2%",
      // top: 100,
      // bottom: 20,
      data: chartData[0].legendData,
    },
    dataZoom: [
      {
        type: "slider",
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
      },
      {
        type: "slider",
        show: true,
        yAxisIndex: [0],
        left: "91%",
        start: 0,
        end: 100,
      },
      {
        type: "inside",
        xAxisIndex: [0],
        start: 1,
        end: 35,
      },
      {
        type: "inside",
        yAxisIndex: [0],
        start: 29,
        end: 36,
      },
      // {
      //   id: "dataZoomMouse",
      //   type: "inside",
      //   realtime: true,
      // },
      // {
      //   id: "dataZoomX",
      //   type: "slider",
      //   xAxisIndex: [0],
      //   filterMode: "filter",
      // },
    ],
    toolbox: {
      show: true,
      top: 50,
      feature: {
        dataZoom: {
          yAxisIndex: "none",
        },
        dataView: { readOnly: false },
        saveAsImage: {},
      },
    },
    axisPointer: {
      link: { xAxisIndex: "all" },
      label: {
        backgroundColor: "#777",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        animation: true,
        label: {
          backgroundColor: "#505765",
        },
      },
      // formatter: function (params) {
      //   var result = params[0].name + "<br>";
      //   params.forEach(function (item) {
      //     var unit = item.seriesUnit || "";
      //     result += item.seriesName + ": " + item.value + " " + unit + "<br>";
      //   });
      //   return result;
      // },
    },
    xAxis: chartData[0].xAxis,
    yAxis: chartData[0].yAxis,
    series: chartData[0].series,
  };
  option && chart.setOption(option);
}
