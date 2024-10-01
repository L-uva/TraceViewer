function parseTrace(trace, actualTime = false, prefix = "", timeStamp) {
  if (prefix) {
    prefix = prefix + "_";
  }

  // Ett mellan objekt som vi använder oss av medans vi parsar XML filen...
  let processingObject = {
    time: {
      id: "Timerbara",
      name: "time",
      description: "timer",
      comment: "timer",
      value: [],
      timestamp: [],
    },
  };

  // Det objektet som vi kommer returnera från funktionen
  let parsedObject = {};

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(trace, "application/xml");
  const traceData = xmlDoc.getElementsByTagName("traceData")[0];

  // Plocka ut tidsstämpeln i ms
  let traceStartInMS = 0;
  const factor = 1000;
  if (actualTime) {
    const frameHeader = traceData.getElementsByTagName("frameHeader")[0];
    const startTime = frameHeader.getAttribute("startTime");
    const date = new Date(startTime);
    traceStartInMS = date.getTime();
  } else {
    if (timeStamp) {
      traceStartInMS = timeStamp.getTime();
    } else {
      const date = new Date();
      traceStartInMS = date.getTime();
    }
  }

  // Plocka ut alla signaler som är inlagda i Tracet
  try {
    const dataSignal = traceData.getElementsByTagName("dataSignal");
    var dataSignalsArray = Array.from(dataSignal);
  } catch (error) {
    alert("XML File corupted");
    return;
  }

  // Gå igenom alla signaler
  dataSignalsArray.forEach((dataSignal) => {
    const name = dataSignal.getAttribute("name");
    const id = dataSignal.getAttribute("id");
    const unit = dataSignal.getAttribute("unitsType");

    processingObject[id] = {
      id,
      name,
      unit,
      value: [],
      timestamp: [],
      yAxis: undefined,
    };
  });

  // Alla mätvärden i ett array
  const rec = traceData.getElementsByTagName("rec");
  const recArray = Array.from(rec);

  // Gå igenom varje rad
  for (let i = 0; i < recArray.length; i++) {
    const recLine = recArray[i].getAttributeNames();

    // Gå igenom alla mätvärden på den raden
    // Spara värdet samt timestamp
    for (let j = 0; j < recLine.length; j++) {
      // if (recLine[j] !== "time") {
      // Om värdet är samma som förra värdet, hoppa över det... eller
      // Ja vi gör så sålänge då slipper vi sista raden
      // Kanske blir problem längre fram, då tar vi de då...
      // Ja nu blev de problem din jävel......
      // const lastValue = processingObject[recLine[j]].value[processingObject[recLine[j]].value.length - 1];
      // const currentValue = Number(recArray[i].getAttribute(recLine[j]));
      // if (currentValue !== lastValue) {
      let value = recArray[i].getAttribute(recLine[j]);

      // Om de är en PLC signal vi kollar på så är det en sträng som är true eller false
      // Kanske ska vi snygga till med en terenery... mnja de funkar nu....
      if (value == "false" || value == "true") {
        if (value == "true") {
          value = 1;
        } else {
          value = 0;
        }
      } else {
        value = Number(value);
      }

      // processingObject[recLine[j]].value.push(Number(recArray[i].getAttribute(recLine[j])));
      processingObject[recLine[j]].value.push(value);
      processingObject[recLine[j]].timestamp.push(Number(recArray[i].getAttribute("time")) * factor + traceStartInMS);
      // }
      // }
    }
  }

  // Plocka kommentaren som vi lagt in, de namnet som vi kommer använda oss av sen.
  const traceDisplaySetup = xmlDoc.getElementsByTagName("traceDisplaySetup")[0];
  const signals = traceDisplaySetup.getElementsByTagName("signals")[0];
  const signal = Array.from(signals.getElementsByTagName("signal"));

  // Lägg in kommentaren i processingObject
  signal.forEach((signal) => {
    for (const key in processingObject) {
      const name = processingObject[key].name;
      const signalName = signal.getAttribute("name");
      const description = signal.getAttribute("description");
      processingObject[key].yAxis = signal.getAttribute("axisDisplay");
      if (name === signalName) {
        processingObject[key].description = description;
      }
    }
  });

  // Skapa objektet som vi ska returnera
  for (const id in processingObject) {
    const name = prefix + processingObject[id].description;
    parsedObject[name] = {
      id: processingObject[id].id,
      timestamp: processingObject[id].timestamp,
      value: processingObject[id].value,
      name: processingObject[id].name,
      comment: name,
      unit: processingObject[id].unit,
      yAxis: processingObject[id].yAxis,
    };
  }
  console.log("Parse", parsedObject);
  return parsedObject;
}
