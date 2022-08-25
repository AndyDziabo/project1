//////////////////////
// GLOBAL VARIABLES //
//////////////////////

let CITY;
let INPUT_ZIP;
let FORECAST_ARY = [    // holds forecast for today + 5 days
    [], [], [], [], [], []
];

// HTML elements
const detailsCity = document.getElementById('details-city-name');
const detailsIcon = document.getElementById('details-weather-icon');
const detailsList = document.querySelector('#details ul');
const forecastBtnDiv = document.querySelector('#toggleForecast');
const forecastMenu = document.querySelector('#daysMenu');
const locationBtnDiv = document.querySelector('#toggle-locations');
const locationMenu = document.querySelector('#location-menu');
const zip = document.querySelector('#zip');
const zip2 = document.querySelector('#zip2');

// hide side menus
document.getElementById('left').style.visibility = 'hidden';
document.getElementById('right').style.visibility = 'hidden';
document.getElementById('main').style.display = 'none';



///////////////////////////
// HTML ELEMENT TOGGLING //
///////////////////////////

//Controls the HTML elements being displayed. toggleMain starts the page with just a zip code submit
//form, then switches to the details view once a zip code is subbmitted. toggleMenu switches the visibility 
//of the side menu that contains the forecast. It is controlled by the "Show Forecast" button.
forecastBtnDiv.addEventListener('click', e => toggleMenu('right'));
locationBtnDiv.addEventListener('click', e => toggleMenu('left'));

function toggleMenu (divId) {
    let menu = document.getElementById(`${divId}`);
    if (menu.style.visibility === 'hidden') {
        menu.style.visibility = 'visible';
        if (divId === 'right') {
            forecastBtnDiv.textContent = 'hide forecast';
        }
    } else {
        menu.style.visibility = 'hidden';
        if (divId === 'right') {
            forecastBtnDiv.textContent = 'show forecast';
        }
    }
}

function toggleMain () {
    const logoDiv = document.getElementById('logo');
    const mainDiv = document.getElementById('main');
    if (mainDiv.style.display === 'none') {
        mainDiv.style.display = 'block';
        logoDiv.style.display = 'none';
    }
}

function toggleDisplay (element) {
    if (element.classList.contains('hide')) {
        element.classList.remove('hide');
    } else {
        element.classList.add('hide');
    }
}



/////////////////////
// ZIP CODE SUBMIT //
/////////////////////

//Handles zip code form - Takes a zip code and returns the longitude and lattitude. Calls 'storeFavorites' to store 
//the zip, longitude, and lattitude. Then calls 'latLon' to use the longitude and lattitude data to get the 5 day forecast.
zip2.addEventListener('submit', e => zipEntered(e));
zip.addEventListener('submit', e => zipEntered(e));

function zipEntered(e){
    e.preventDefault();
    const errorMessage = document.getElementById('errorDisplay');
    const innerErrMessage = document.getElementById('left-bottom');

    INPUT_ZIP = e.target[0].value;

    if (typeof parseInt(INPUT_ZIP) !== 'number') {

        errorMessage.innerText = 'Enter a zip code with 5 Numbers';
        innerErrMessage.style.visibility = 'visible';
        innerErrMessage.innerText = 'Enter a zip code with 5 Numbers';
        setTimeout(function(){
            errorMessage.innerText = '';
            innerErrMessage.style.visibility = 'hidden';
        },2000);

    } else if (INPUT_ZIP.length !== 5) {

        errorMessage.innerText = 'Enter a zip code with 5 Numbers';
        innerErrMessage.style.visibility = 'visible';
        innerErrMessage.innerText = 'Enter a zip code with 5 Numbers';
        setTimeout(function(){
            errorMessage.innerText = '';
            innerErrMessage.style.visibility = 'hidden';
        },2000);

    } else {

        fetchCoordinatesByZip(INPUT_ZIP)
        .then(res => {
            if (res.ok) {
                return res.json();
            }
            throw new Error('Not a valid zip code');
        })
        .then (geoData => {
            toggleMain();
            displayZip(INPUT_ZIP, geoData);
            fetchAndRender(geoData);
            fetchSavedLocations()
            .then(savedZips => {
                if (!savedZips.find(entry => entry.id === INPUT_ZIP)) {
                    saveLocation(geoData);
                    savedZips.push({
                        id: INPUT_ZIP,
                        geoData: geoData
                    });
                }
                renderLocationMenu(savedZips);
            });
        })
        .catch (error => {
            console.log(error);     // TO-DO: check if handling error like this is ok
            errorMessage.innerText = 'Not a valid Zip Code';
            innerErrMessage.style.visibility = 'visible';
            innerErrMessage.innerText = 'Not a valid Zip Code';
            setTimeout(function(){
                errorMessage.innerText = '';
                innerErrMessage.style.visibility = 'hidden';
            },2000);
        });
    }
    e.target.querySelector('input[type="text"]').value = '';   // reset field
};



////////////////////
// MENU RENDERING //
////////////////////

function fetchAndRender (geoData) {

    fetchWeatherByLatLon(geoData.lat, geoData.lon)
        .then(weatherData => {
            CITY = weatherData.name;
            displayDetails(weatherData);
        });

    fetchForecastByLatLon(geoData.lat, geoData.lon)
        .then(forecastData => {
            storeForecast(forecastData);
            renderForecastMenu();
        });

}

function renderLocationMenu (savedZips) {
    locationMenu.innerHTML = '<ul></ul>';   // clear any existing

    savedZips.sort(function(a, b) {         // sort zip codes
        return a.id - b.id;
    });

    savedZips.forEach(entry => {            // for each zip, add to location menu list

        const newLine = document.createElement('li');
        newLine.classList.add('location');
        const newSpan = document.createElement('span');
        newSpan.textContent = `${entry.id} -- ${entry.geoData.name} `;

        newLine.addEventListener('click', (event) => {
            displayZip(entry.id, entry.geoData);
            fetchAndRender(entry.geoData);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = `X`;
        deleteBtn.value = entry.id;

        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteLocation(event.target.value);
        });

        newLine.append(deleteBtn, newSpan);
        locationMenu.append(newLine);

    });
}

function renderForecastMenu () {
    forecastMenu.innerHTML = '<ul></ul>';    // clear any existing

    FORECAST_ARY.forEach((day, index) => {

        const nextDay = document.createElement('li');
        nextDay.classList.add('days');
        nextDay.value = index;

        switch (index) {
            case 0:
                nextDay.textContent = 'today';
                break;
            case 1:
                nextDay.textContent = 'tomorrow';
                break;
            default:
                nextDay.textContent = day[0];
                break;
        }

        forecastMenu.appendChild(nextDay);

        nextDay.addEventListener('click', e => {
            const dayIndex = e.target.value;
            const dayForecast = reduceHourlyForecastsToDay(FORECAST_ARY[dayIndex]);
            displayDetails(dayForecast);
        });

    });
}



////////////////////////////
// FORECAST DATA HANDLING //
////////////////////////////

function storeForecast (forecastData) {
    FORECAST_ARY = [
        [], [], [], [], [], []  // clear previous entries
    ];

    const today = new Date().getDay();

    forecastData.list.forEach((entry) => {
        // store forecast by days from today
        const entryDate = new Date(entry.dt * 1000);
        const entryDay = entryDate.getDay();
        let index = entryDay - today;
        if (today > entryDay) {index += 7}
        // set index 0 to day of week
        if (FORECAST_ARY[index].length === 0) {
            const entryDayOfWeek = entryDate.toLocaleString('en-US', {weekday: 'long'});
            FORECAST_ARY[index].push(entryDayOfWeek.toLowerCase());
        }
        // push forecast data
        FORECAST_ARY[index].push(entry);
    });
}

function reduceHourlyForecastsToDay(weatherAry) {

    // copy passed array & remove first element
    let weatherAryCopy = weatherAry.map(ele => ele);
    weatherAryCopy.shift();

    // create return object
    let dayForecast = {};

    // set timestamp to noon of day
    let timestamp = new Date(weatherAryCopy[0].dt * 1000);
    timestamp.setHours(12, 0, 0);
    dayForecast.dt =  Math.floor(timestamp.getTime() / 1000);

    // get values
    let lowestLow = 100;
    let highestHigh = -100;
    let tempSum = 0;
    let humiditySum = 0;
    let feelsLikeSum = 0;

    weatherAryCopy.forEach(entry => {

        // add temperature to sum total for averaging
        tempSum += entry.main.temp;
        // find lowest low for day
        const minTemp = entry.main.temp_min;
        if (minTemp < lowestLow) {lowestLow = minTemp}
        // find highest high for day
        const maxTemp = entry.main.temp_max;
        if (maxTemp > highestHigh) {highestHigh = maxTemp};
        // add humidity to sum total for averaging
        humiditySum += entry.main.humidity;
        // add feels like to sum total for averaging
        feelsLikeSum += entry.main.feels_like;

    });

    const numEntries = weatherAryCopy.length;
    const tempAvg = tempSum / numEntries;
    const humidityAvg = humiditySum / numEntries;
    const feelsLikeAvg = feelsLikeSum / numEntries;

    // set values
    dayForecast.main = {};
    dayForecast.main.humidity = humidityAvg;
    dayForecast.main.temp = tempAvg;
    dayForecast.main.temp_max = highestHigh;
    dayForecast.main.temp_min = lowestLow;
    dayForecast.main.feels_like = feelsLikeAvg;

    // get weather for middle entry
    const middle = Math.floor(numEntries / 2);
    dayForecast.weather = weatherAryCopy[middle].weather;
    let iconCode = weatherAryCopy[middle].weather[0].icon
    dayForecast.weather[0].icon = iconCode.slice(0, 2) + 'd';
    dayForecast.wind = weatherAryCopy[middle].wind;

    return dayForecast;
}



///////////////////////
// DISPLAY FUNCTIONS //
///////////////////////

function displayDetails (data) {
    // clear any existing
    detailsList.innerHTML = '';
    detailsCity.innerHTML = '';
    detailsIcon.innerHTML = '';
    
    // set background image
    changeBackground(data.weather[0].id);

    // create HTML Elements
    const iconImg = document.createElement('p')
    const img = document.createElement('img')
    const windSpeed = document.createElement('li')
    const temperature = document.createElement('li')
    const weatherDescription = document.createElement('p')
    const feelsLike = document.createElement('li')
    const highTemp = document.createElement('li')
    const lowTemp = document.createElement('li')
    const humidity = document.createElement('li')

    // set attributes
    img.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    lowTemp.id = 'loTemp';
    temperature.id = 'temp';

    // set values
    detailsCity.textContent = CITY
    feelsLike.textContent = `Feels Like: ${Math.round(data.main.feels_like)} F`
    highTemp.textContent = `High: ${Math.round(data.main.temp_max)} F`
    humidity.textContent = `Humidity: ${Math.round(data.main.humidity)}%`
    lowTemp.textContent = `Low: ${Math.round(data.main.temp_min)} F`
    temperature.textContent = `${Math.round(data.main.temp)} F`
    weatherDescription.textContent = data.weather[0].description
    windSpeed.textContent = `Wind Speed: ${data.wind.speed} MPH`

    // append elements
    iconImg.append(img);
    detailsIcon.append(iconImg);
    detailsList.append(weatherDescription, temperature, feelsLike, highTemp, lowTemp,humidity, windSpeed);
};

function displayZip(zipCode, zipData) {
    locationBtnDiv.innerHTML = '';
    locationBtnDiv.textContent = zipCode;
    if (typeof zipData !== 'undefined') {
        locationBtnDiv.textContent += ` -- ${zipData.name}`;
    }
}

//Changes the backgound image of the details based on the weather description
function changeBackground (id) {
    let img;
    let num = String(id).charAt(0);
    num = Number(num);
    if (id === 800) {
        img = 'sunnySky.png';
    } else {
        switch (num) {
            case 2:
                img = 'thunderstorm.jpg';
                break;
            case 3:
                img = 'drizzle.jpg';
                break;
            case 5:
                img = 'rain.jpg';
                break;
            case 6:
                img = 'snow.jpg';
                break;
            case 7:
                img = 'hazy.jpg';
                break;
            case 8:
                img = 'clouds.jpg';
                break;
        }
    }
    document.getElementById('details').style.backgroundImage = `url("img/${img}")`;
}



////////////////
// DATA CALLS //
////////////////

// Open Weather API calls

function fetchCoordinatesByZip (zipCode) {      // gets latitude & longitude using zip code
    return fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${API_KEY}`)
}

function fetchWeatherByLatLon (lat, lon) {      // gets current weather using latitude & longitude
    return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`)
    .then(res => res.json());
}

function fetchForecastByLatLon (lat, lon) {     // gets forecasted weather using latitude & longitude
    return fetch (`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`)
    .then(res => res.json());
}

// JSON server calls

function fetchSavedLocations () {
    return fetch('http://localhost:3000/zipcodes')
    .then(res => res.json());
}

function saveLocation (data) {
    const zipCodeGeoData = {
        id: data.zip,
        geoData: data
    }
    fetch('http://localhost:3000/zipcodes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(zipCodeGeoData)
    });
}

function deleteLocation (zipCode) {
    fetch (`http://localhost:3000/zipcodes/${zipCode}`, {method: 'DELETE'})
    .then(() => {
        fetchSavedLocations()
        .then(savedZips => {
            renderLocationMenu(savedZips);
        });
    });
}