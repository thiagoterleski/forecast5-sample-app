const APIHOST = "https://api.openweathermap.org/data/2.5";
const APIKEY = "f106011efd4da51e7d8268d042e021e8";
const INITIAL_CITY = "Vancouver";

const app = function() {
  
  // API request function
  const loadWeatherData = function(city) {
    return fetch(
      `${APIHOST}/forecast?q=${city}&mode=json&units=metric&appid=${APIKEY}`
    ).then(function(response) {
      return response.json();
    });
  };

  // Helper to render a html content inside a DOM element
  const render = function(template, node) {
    node.innerHTML = template;
  };

  const prepareData = function(data) {
    
    // Small function helper to get the most frequent value from an object
    // I adapted it from some examples I found, the idea is first, getting
    // the number of times the is found in the array data, and then, using reduce
    // function again we can get only the highest value
    const getMostFrequentValue = array => {
      const elements = array.reduce((acc, curr) => {
        if (curr in acc) {
          acc[curr]++;
        } else {
          acc[curr] = 1;
        }
        return acc;
      }, {});

      return Object.keys(elements).reduce((a, b) =>
        elements[a] > elements[b] ? a : b
      );
    };

    const weatherTypes = [];
    // Mount a new object grouped by day
    const groupedByDays = data.list
      .map(item => {
        const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          new Date(item.dt_txt.replace(/-/g, '/')).getDay()
        ];

        // Stores the main weather type in a array
        // It will be used to get the most frequent weather
        weatherTypes.push(item.weather[0].main);
        
        const icon = `http://openweathermap.org/img/w/${item.weather[0].icon}.png`;
        return Object.assign(
          { weekday: weekday },
          item.weather[0],
          { icon: icon },
          { clouds: item.clouds },
          { date: item.dt_txt },
          { main: item.main },
          { day: new Date(item.dt_txt).getDay() },
        );
      })
      .reduce(function(h, obj) {
        h[obj.weekday] = (h[obj.weekday] || []).concat(obj);
        return h; 
      }, {})

      // Get the most recurrent weather for the 5 days and change the background image to match it
      const mostFrequentWeather = getMostFrequentValue(weatherTypes);
      changeBackground(mostFrequentWeather);

      // Sort by weekday and return with array format
      const sortedDataSet = Object.keys(groupedByDays).sort(function(a, b) {
        return new Date(b[0].date) - new Date(a[0].date);
      }).map(key => ({ weekday: key, items: groupedByDays[key] }));

    return sortedDataSet;
  };

  // Create the template for the weather cards using template string
  const mountForecastCards = function(data) {

    return data.map(function(dayObj) {
      console.log(dayObj);
      const groupHours = dayObj.items.map(item => {
        const d = new Date(item.date);
        const hour = d.toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
        return `
          <tr>
            <td width="48 class="icon"><img alt="${hour}" src="${item.icon}" width="32" height="32" /></td>
            <td class="temp"><b>${Math.round(item.main.temp)}<span>&deg;C</span></b></td>
            <td class="desc">${item.description}</td>
            <td class="hour">${hour}</td>
          </tr>
      `}).join("");

      return `
      <div class="forecast-card">
        <div class="section day">${dayObj.weekday}</div>
        <div class="section group-hours">
          <table class="daily-hours-table">
              <tbody>
                ${groupHours}
              </tbody>
          </table>
        </div>
      </div>
      `;

      })
      .join("");
  };

  const renderHTMLApplication = function(html) {
    render(html, document.querySelector(".results"));
  };

  const changeBackground = function(weather) {
    document.body.style.backgroundImage = `url(assets/${weather.toLowerCase()}.jpg)`;
  }


  const init = function() {

    // Check if there's a city param defined, if has one, 
    // then fill the search input with the current value
    const cityQuery = new URL(location.href).searchParams.get("city");

    if (cityQuery) {
      document.querySelector('.change-city-input').value = cityQuery;
    }

    loadWeatherData(cityQuery || INITIAL_CITY)
      .then(prepareData)
      .then(mountForecastCards)
      .then(renderHTMLApplication)
      .catch(function(error) {
        console.error("Something is not going well");
        render("No data found for this city, please try another city name", document.querySelector(".forecast-card"));
      });
  };

  init();
};

document.addEventListener("DOMContentLoaded", app);
