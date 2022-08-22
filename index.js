//
//Global variable declaration
//
// let zipCodeEntry = 00000;
// let lat = 0;
// let lon = 0;
let repeatZip = false;
let FORECAST_ARY = [
    [], [], [], [], [], []  // forecast for today + 5 days
];

// HTML elements
const forecastMenu = document.querySelector('#daysMenu');



////////////////////////
//Zip code submit form//
////////////////////////

//Handles zip code form - Takes a zip code and returns the longitude and lattitude. Calls 'storeFavorites' to store 
//the zip, longitude, and lattitude. Then calls 'latLon' to use the longitude and lattitude data to get the 5 day forecast.
const zip = document.querySelector('#zip');

zip.addEventListener('submit', e => {
    e.preventDefault();
    fetchCoordinatesByZip(e.target.zipCode.value)
    .then (geoData => {
        fetchWeatherByLatLon(geoData.lat, geoData.lon)
            .then(weatherData => displayDetails(weatherData));
        fetchForecastByLatLon(geoData.lat, geoData.lon)
            .then(forecastData => {
                storeForecast(forecastData);
                renderForecastMenu();
            });
    })
    .catch (error => console.log(error));
});

// calls to GEO API to get latitude & longitude based on zip code
function fetchCoordinatesByZip (zipCode) {
    return fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${API_KEY}`)
    .then(res => {
        if (res.ok) {return res.json()}
        throw new Error('Not a valid zip code');
    })
    // .then(geoData => {
    //     fetchWeatherByLatLon(geoData.lat, geoData.lon);
    //     fetchForecastByLatLon(geoData.lat, geoData.lon);
    //     // if (repeatZip === false) {
    //     //     saveLocations(data);
    //     //     popDropDown(data);
    //     // } else {
    //     //     repeatZip = false;
    //     //     console.log('Zip already exists');
    //     // }
    // })
    // .catch(error => alert(error));
}

function fetchWeatherByLatLon (lat, lon) {
    return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    // .then(weatherData => displayDetails(weatherData))
    // .catch(error => console.error('Error'));
}

function fetchForecastByLatLon (lat, lon) {
    return fetch (`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    .then(res => res.json())
    // .then(forecastData => storeForecast(forecastData))
    // .catch(error => console.log(error));
}


// STORE FORECAST DATA INTO GLOBAL ARRAY

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
            FORECAST_ARY[index].push(entryDayOfWeek);
        }
        // push forecast data
        FORECAST_ARY[index].push(entry);
    });
}

// RENDER FORECAST MENU WITH DATA

function renderForecastMenu () {
    forecastMenu.innerHTML = '';    // clear any existing
    FORECAST_ARY.forEach((day, index) => {
        const nextDay = document.createElement('li');
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
    })
}





//////////////////
//Drop-down List//
//////////////////

//On page load/refresh, it pulls the info stored in the db.json file, and sends it to the 'popDropDown' function to
//populate the drop down list. 
fetch('http://localhost:3000/zipcodes')
.then(res => res.json())
.then(data => data.forEach(i => popDropDown(i)));

//Populates the favorites drop-down menu every time a zip code is entered. 
function popDropDown(data){
    const opt = document.createElement('option');
    opt.value = data.zip;
    opt.textContent = `${data.zip} -- ${data.name}`;
    localDropDown.append(opt);
}

//Stores the location's data in the db.json file to persist the list, and be able to recall the already searched zipcodes.
function saveLocations(data){
fetch('http://localhost:3000/zipcodes', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify(data)
})
.then(res => res.json())
.then(data => console.log(data));
}

//Handles the drop-down menu of previously searched zip codes. (still needs to call a renderingfunction to put display 
//the data in the days menu, and the details section).
const localDropDown = document.querySelector('#favLocation');
localDropDown.addEventListener('change', e => selectFav(e));
function selectFav(e){
    if(e.target.value !== ""){
        repeatZip = true;
        fetchCoordinatesByZip(e.target.value);
    }else{
        console.log('blank selected');
    }
}




///////////////////////////////////////////////////////
//Render the info to the day menu and details section//
///////////////////////////////////////////////////////

//display the details of the selected day
const details = document.querySelector('#details');
function displayDetails(data){
    console.log(data);
}

//Select day from day menu

forecastMenu.addEventListener('click', e => console.log(e.target));