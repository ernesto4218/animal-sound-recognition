const el = document.getElementById('pass-data');
const logs = JSON.parse(el.dataset.logs || {});
console.log(logs);

function loadAnimalsToday(data) {

  const today = new Date().toISOString().split("T")[0];

  // Step 1: Filter data for today
  const todaysData = data.filter(item => item.date_added.startsWith(today));
  const distinctAnimals = new Set(todaysData.map(item => item.name));
  const numberOfDistinctAnimals = distinctAnimals.size;

  
  // Step 2: Create time-based groupings per animal
  const animalTimeMap = {};

  todaysData.forEach(item => {
    const time = new Date(item.date_added).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const animal = item.name;

    if (!animalTimeMap[animal]) {
      animalTimeMap[animal] = {};
    }

    if (!animalTimeMap[animal][time]) {
      animalTimeMap[animal][time] = 0;
    }

    animalTimeMap[animal][time]++;
  });

  // Step 3: Prepare series for each animal
  const timesSet = new Set();
  Object.values(animalTimeMap).forEach(timeData => {
    Object.keys(timeData).forEach(time => timesSet.add(time));
  });

  const sortedTimes = Array.from(timesSet).sort((a, b) => {
    return new Date('1970/01/01 ' + a) - new Date('1970/01/01 ' + b);
  });

  const series = Object.entries(animalTimeMap).map(([animal, timeCounts]) => ({
    name: animal,
    data: sortedTimes.map(time => timeCounts[time] || 0)
  }));

  // Step 4: Chart options
  const options = {
    chart: {
      height: "300px",
      maxWidth: "100%",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 2,
    },
    grid: {
      show: true,
      strokeDashArray: 4,
    },
    series: series,
    xaxis: {
      categories: sortedTimes,
      title: {
        text: "Time"
      },
    },
    yaxis: {
      title: {
        text: "Count"
      },
    },
  };

  if (document.getElementById("area-chart-flexible") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("area-chart-flexible"), options);
    chart.render();
  }
}

function loadAnimalsLast7Days(data) {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6); // includes today

  // Format dates to YYYY-MM-DD for comparison
  const formatDate = date => date.toISOString().split("T")[0];

  // Step 1: Filter data for the last 7 days
  const last7DaysData = data.filter(item => {
    const itemDate = new Date(item.date_added);
    return itemDate >= sevenDaysAgo && itemDate <= today;
  });

  // Step 2: Group by animal and date
  const animalDateMap = {};
  const allDatesSet = new Set();

  last7DaysData.forEach(item => {
    const date = formatDate(new Date(item.date_added));
    const animal = item.name;

    allDatesSet.add(date);

    if (!animalDateMap[animal]) {
      animalDateMap[animal] = {};
    }

    if (!animalDateMap[animal][date]) {
      animalDateMap[animal][date] = 0;
    }

    animalDateMap[animal][date]++;
  });

  // Step 3: Sort all dates in chronological order
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

  // Step 4: Build series
  const series = Object.entries(animalDateMap).map(([animal, dateCounts]) => ({
    name: animal,
    data: sortedDates.map(date => dateCounts[date] || 0)
  }));

  // Step 5: Chart options
  const options = {
    chart: {
      height: "300px",
      maxWidth: "100%",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: { enabled: false },
      toolbar: { show: false },
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    grid: {
      show: true,
      strokeDashArray: 4,
    },
    series: series,
    xaxis: {
      categories: sortedDates,
      title: { text: "Date" },
    },
    yaxis: {
      title: { text: "Count" },
    },
  };

  // Step 6: Render chart
  if (document.getElementById("area-chart-flexible") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("area-chart-flexible"), options);
    chart.render();
  }
}

function loadAnimalsThisMonth(data) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const formatDate = date => date.toISOString().split("T")[0];

  // Step 1: Filter data for this month
  const thisMonthData = data.filter(item => {
    const itemDate = new Date(item.date_added);
    return itemDate >= startOfMonth && itemDate <= today;
  });

  // Step 2: Group by animal and date
  const animalDateMap = {};
  const allDatesSet = new Set();

  thisMonthData.forEach(item => {
    const date = formatDate(new Date(item.date_added));
    const animal = item.name;

    allDatesSet.add(date);

    if (!animalDateMap[animal]) {
      animalDateMap[animal] = {};
    }

    if (!animalDateMap[animal][date]) {
      animalDateMap[animal][date] = 0;
    }

    animalDateMap[animal][date]++;
  });

  // Step 3: Sort all dates in chronological order
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

  // Step 4: Build series
  const series = Object.entries(animalDateMap).map(([animal, dateCounts]) => ({
    name: animal,
    data: sortedDates.map(date => dateCounts[date] || 0)
  }));

  // Step 5: Chart options
  const options = {
    chart: {
      height: "300px",
      maxWidth: "100%",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: { enabled: false },
      toolbar: { show: false },
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    grid: {
      show: true,
      strokeDashArray: 4,
    },
    series: series,
    xaxis: {
      categories: sortedDates,
      title: { text: "Date" },
    },
    yaxis: {
      title: { text: "Count" },
    },
  };

  // Step 6: Render chart
  if (document.getElementById("area-chart-flexible") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("area-chart-flexible"), options);
    chart.render();
  }
}

function loadAnimalsAllTime(data) {
  const formatDate = date => new Date(date).toISOString().split("T")[0];

  // Step 1: Group by animal and date
  const animalDateMap = {};
  const allDatesSet = new Set();

  data.forEach(item => {
    const date = formatDate(item.date_added);
    const animal = item.name;

    allDatesSet.add(date);

    if (!animalDateMap[animal]) {
      animalDateMap[animal] = {};
    }

    if (!animalDateMap[animal][date]) {
      animalDateMap[animal][date] = 0;
    }

    animalDateMap[animal][date]++;
  });

  // Step 2: Sort all dates in chronological order
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

  // Step 3: Build series
  const series = Object.entries(animalDateMap).map(([animal, dateCounts]) => ({
    name: animal,
    data: sortedDates.map(date => dateCounts[date] || 0)
  }));

  // Step 4: Chart options
  const options = {
    chart: {
      height: "300px",
      maxWidth: "100%",
      type: "area",
      fontFamily: "Inter, sans-serif",
      dropShadow: { enabled: false },
      toolbar: { show: false },
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    dataLabels: { enabled: false },
    stroke: { width: 2 },
    grid: {
      show: true,
      strokeDashArray: 4,
    },
    series: series,
    xaxis: {
      categories: sortedDates,
      title: { text: "Date" },
    },
    yaxis: {
      title: { text: "Count" },
    },
  };

  // Step 5: Render chart
  if (document.getElementById("area-chart-flexible") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("area-chart-flexible"), options);
    chart.render();
  }
}

function loadAnimalsTodayBar(data) {
  let mostRepeatedAnimal = null;
  let highestCount = 0;

  const today = new Date().toISOString().split("T")[0];

  // Step 1: Filter data for today
  const todaysData = data.filter(item => item.date_added.startsWith(today));
  const distinctAnimals = new Set(todaysData.map(item => item.name));
  const numberOfDistinctAnimals = distinctAnimals.size;

  // Step 2: Count how many times each animal appears
  const animalCounts = {};
  todaysData.forEach(item => {
    const animal = item.name;
    animalCounts[animal] = (animalCounts[animal] || 0) + 1;
  });

  // Step 3: Prepare multiple single-bar series for each animal
  const series = Object.entries(animalCounts).map(([animal, count]) => ({
    name: animal,
    data: [count],
  }));

  const options = {
    chart: {
      type: "bar",
      height: "285px",
      stacked: true,
      fontFamily: "Inter, sans-serif",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "70%",
        borderRadius: 6,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: val => `${val} times`
      },
    },
    xaxis: {
      categories: [""], // only one category for horizontal bar
      title: {
        text: "Count",
      },
    },
    yaxis: {
      show: false, // hiding y-axis label since animals are shown as series names
    },
    legend: {
      position: 'bottom',
    },
    grid: {
      show: true,
      strokeDashArray: 4,
    },
    series: series,
  };

  if (document.getElementById("bar-chart") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("bar-chart"), options);
    chart.render();

    for (const [animal, count] of Object.entries(animalCounts)) {
      if (count > highestCount) {
        highestCount = count;
        mostRepeatedAnimal = animal;
      }
    }

    animalsFrequncyTodayTXT.textContent = mostRepeatedAnimal + " : " + highestCount;
  }
}

loadAnimalsTodayBar(logs);

function loadPie(data) {
  // Step 1: Count total detections per animal
  const animalCounts = {};
  let totalCount = 0;

  data.forEach(item => {
    const animal = item.name;
    if (!animalCounts[animal]) {
      animalCounts[animal] = 0;
    }
    animalCounts[animal]++;
    totalCount++;
  });

  // Step 2: Sort animals by count (optional for consistent display order)
  const sortedAnimals = Object.entries(animalCounts).sort((a, b) => b[1] - a[1]);

  // Step 3: Extract series and labels
  const series = sortedAnimals.map(([_, count]) => parseFloat(((count / totalCount) * 100).toFixed(2)));
  const labels = sortedAnimals.map(([animal]) => animal);

  // Step 4: Fixed color scheme (reuse from your existing charts)
  const defaultColors = ["#1C64F2", "#16BDCA", "#9061F9", "#FACC15", "#F472B6", "#34D399", "#FB923C", "#F87171"];
  const colors = defaultColors.slice(0, labels.length); // Trim to match label count

  // Step 5: Chart options
  const options = {
    series: series,
    labels: labels,
    colors: colors,
    chart: {
      height: 280,
      width: "100%",
      type: "pie",
    },
    stroke: {
      colors: ["white"],
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -25
        },
        size: "100%",
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontFamily: "Inter, sans-serif",
      },
      formatter: function (val) {
        return val.toFixed(1) + "%";
      }
    },
    legend: {
      position: "bottom",
      fontFamily: "Inter, sans-serif",
    },
    yaxis: {
      labels: {
        formatter: val => val + "%"
      }
    },
    xaxis: {
      labels: {
        formatter: val => val + "%",
      },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
  };

  // Step 6: Render chart
  if (document.getElementById("pie-chart") && typeof ApexCharts !== 'undefined') {
    const chart = new ApexCharts(document.getElementById("pie-chart"), options);
    chart.render();
  }
}


loadPie(logs);

// filter
const dropdownList = document.getElementById('dropdownList');
dropdownList.addEventListener('click', function (event) {
    if (event.target.tagName === 'A') {
      event.preventDefault(); // prevent default anchor behavior
      const selectedText = event.target.textContent.trim();
      handleSelection(selectedText);
    }
});

function handleSelection(selection) {
  console.log("User selected:", selection);
  document.getElementById('selectedDropdownTXT').textContent = selection;

  document.getElementById('area-chart-flexible').innerHTML = '';
  if (selection === 'Today'){
    loadAnimalsToday(logs);
  } else if (selection === 'Last 7 Days'){
    loadAnimalsLast7Days(logs);
  } else if (selection === 'Last 30 Days'){
    loadAnimalsThisMonth(logs);
  } else if (selection === 'All Time'){
    loadAnimalsAllTime(logs);
  }
}

function triggerClickOnItem(textToClick) {
    const links = dropdownList.querySelectorAll('a');
    for (let link of links) {
      if (link.textContent.trim() === textToClick) {
        link.click(); // Triggers the click event
        break;
      }
    }
  }

// Example usage
triggerClickOnItem('Today');