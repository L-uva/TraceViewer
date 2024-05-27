// var chart = echarts.init(document.getElementById("main"), "dark");
// var chart = echarts.init(document.getElementById("main"));

var chartDom = document.getElementById("chart");
var chart = echarts.init(chartDom, { renderer: "svg" });

const points = 100;

let legendData = ["Time"];

var xAxis = {
  type: "category",
  data: genSine(points).dataX,
};

var series = [
  {
    name: "Sine Wave",
    type: "line",
    data: genSine(points).dataY,
    showSymbol: false,
  },
];

var option = {
  dataZoom: [
    {
      id: "dataZoomMouse",
      type: "inside",
      realtime: true,
      xAxisIndex: [0],
      filterMode: "filter",
    },
    {
      id: "dataZoomX",
      type: "slider",
      xAxisIndex: [0],
      filterMode: "filter",
    },
  ],
  title: {
    text: " ",
  },
  tooltip: {
    trigger: "axis",
  },
  legend: {
    data: ["test"],
    left: 10,
  },
  xAxis: xAxis,
  yAxis: {
    type: "value",
  },
  series: series,
};

chart.setOption(option);

function genSine(points) {
  var dataY = [];
  var dataX = [];
  for (var i = 0; i < points; i++) {
    var x = i / 10;
    dataX.push(x.toFixed(1));
    dataY.push(Math.sin(x));
  }
  return { dataX, dataY };
}

function processHeader(header) {
  // Första raden är tidsaxeln
  var returnObj = {
    0: {
      name: "Time",
      type: "category",
      data: [],
    },
  };
  for (let i = 0; i < header.length; i++) {
    legendData.push(header[i][4]);
    returnObj[i + 1] = {
      name: header[i][4],
      type: "line",
      data: [],
    };
  }

  return returnObj;
}

function processTrace(csv) {
  var data = csv.data;

  var dataStartIndex = 0;

  var headerData = [];

  var header = {};

  // Antal variabler
  // Koppla namn till varibel
  for (let i = 0; i < data.length; i++) {
    if (data[i].length == 2) {
      headerData = data.slice(1, i);

      dataStartIndex = i;

      header = processHeader(headerData);

      break;
    }
  }

  // Koppla data till variabel
  for (let i = dataStartIndex + 2; i < data.length; i++) {
    for (let j = 0; j < data[i].length - 1; j++) {
      header[j].data.push(Number(data[i][j]));
    }
  }

  returnData = {
    x: [],
    y: [],
  };

  for (const key in header) {
    if (header.hasOwnProperty(key)) {
      if (header[key].name == "Time") {
        returnData.x.push(header[key]);
      } else {
        returnData.y.push(header[key]);
      }
    }
  }

  // Convert to MSx[0].data
  for (let i = 0; i < returnData.x[0].data.length; i++) {
    returnData.x[0].data[i] = Number((returnData.x[0].data[i] * 1000).toFixed(2));
  }
  return returnData;
}

function parseXML(xml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");

  const traceDisplaySetup = xmlDoc.getElementsByTagName("traceDisplaySetup")[0];
  const signals = traceDisplaySetup.getElementsByTagName("signals")[0];
  const signal = signals.getElementsByTagName("signal");

  const traceData = xmlDoc.getElementsByTagName("traceData")[0];
  const rec = traceData.getElementsByTagName("rec");

  let xmlData = {
    legend: [],
    xAxis: [],
    series: [],
    raw: {
      time: { name: "Time (s)", data: [], showSymbol: false },
    },
  };

  let signalNames = { time: { id: "time", name: "Time (s)", data: [], showSymbol: false } };

  // Get all signalnames and populate raw object
  for (let i = 0; i < signal.length; i++) {
    const description = signal[i].getAttribute("description");
    const name = signal[i].getAttribute("name");
    const axisDisplay = signal[i].getAttribute("axisDisplay");

    var yAxisIndex = 0;
    if (axisDisplay == "rightSide") {
      yAxisIndex = 1;
    }

    signalNames[name] = {
      id: "",
      name: description,
      data: [],
      type: "line",
      yAxisIndex: yAxisIndex,
      showSymbol: false,
    };
  }

  // Kollar igenom data signal och matchar namnet
  const dataSignals = traceData.getElementsByTagName("dataSignal");

  for (let i = 0; i < dataSignals.length; i++) {
    const name = dataSignals[i].getAttribute("name");
    const id = dataSignals[i].getAttribute("id");

    signalNames[name].id = id;
  }

  // Get all names in first recording
  let recNames = rec[0].getAttributeNames();

  let value = undefined;

  let recordings = {};

  for (let i = 0; i < recNames.length; i++) {
    recordings[recNames[i]] = { data: [] };
  }

  // Get all signaldata and push into raw data arrays
  for (let i = 0; i < rec.length; i++) {
    for (let j = 0; j < recNames.length; j++) {
      // If a recording exist
      if (rec[i].getAttribute(recNames[j]) !== null) {
        value = rec[i].getAttribute(recNames[j]);
        recordings[recNames[j]].data.push(Number(value));
      } else {
        // If its null, get last know value and substitue with that
        // Good or bad I dont know
        let arrPos = recordings[recNames[j]].data.length - 1;
        value = recordings[recNames[j]].data[arrPos];
        recordings[recNames[j]].data.push(value);
      }
    }
  }

  // Aaa fråga inte, vilken jävla soppa.....
  for (const key in signalNames) {
    if (signalNames.hasOwnProperty(key)) {
      for (const key1 in recordings) {
        if (recordings.hasOwnProperty(key1)) {
          if (signalNames[key]["id"] === key1) {
            signalNames[key].data = recordings[key1].data;
          }
        }
      }
    }
  }

  // Itterate over raw object and move data into final array
  for (const key in signalNames) {
    if (signalNames.hasOwnProperty(key)) {
      delete signalNames[key]["id"];
      if (key == "time") {
        xmlData.xAxis.push(signalNames[key]);
      } else {
        xmlData.legend.push(signalNames[key].name);
        xmlData.series.push(signalNames[key]);
      }
    }
  }

  return xmlData;
}

function process() {
  const fileInput = document.getElementById("fileInput");

  let xml = undefined;

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];

    const fileName = file.name;
    const fileExtension = fileName.split(".").pop().toLowerCase();

    if (fileExtension === "xml") {
      xml = true;
    } else {
      xml = false;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      if (xml) {
        var xmlData = parseXML(e.target.result);
        xAxis = xmlData.xAxis;
        series = xmlData.series;
        legendData = xmlData.legend;
      } else {
        var data = Papa.parse(e.target.result);
        var chartData = processTrace(data);
        xAxis = chartData.x;
        series = chartData.y;
      }

      var option = {
        legend: {
          data: legendData,
          align: "left",
        },
        dataZoom: [
          {
            id: "dataZoomMouse",
            type: "inside",
            realtime: true,
          },
          {
            id: "dataZoomX",
            type: "slider",
            xAxisIndex: [0],
            filterMode: "filter",
          },
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
        },
        xAxis: xAxis,
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
            alignTicks: true,
            axisLine: {
              show: true,
            },
          },
        ],
        series: series,
      };
      option && chart.setOption(option);
    };

    reader.readAsText(file);
  } else {
    console.log("No file added");
  }
}

window.addEventListener("resize", function () {
  chart.resize();
});
