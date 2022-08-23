//
// GLOBAL VARIABLE DECLARATION
//
// let zipCodeEntry = 00000;
// let lat = 0;
// let lon = 0;
let repeatZip = false;

let FORECAST_ARY = [
    [], [], [], [], [], []  // forecast for today + 5 days
];

let city;

// HTML ELEMENTS
const forecastMenu = document.querySelector('#daysMenu');
const zip = document.querySelector('#zip');

document.getElementById('right').style.display = 'none';
document.getElementById('main').style.display = 'none';

/////////////////////////
//HTML Element Toggling//
////////////////////////

//Controls the HTML elements being displayed. toggleMain starts the page with just a zip code submit
//form, then switches to the details view once a zip code is subbmitted. toggleMenu switches the visibility 
//of the side menu that contains the forecast. It is controlled by the "Show Forecast" button.
const toggle = document.querySelector('#toggleForecast');
toggle.addEventListener('click', e => toggleMenu());

function toggleMenu(){
    let d = document.getElementById('right');
    if(d.style.display === 'none'){
        d.style.display = 'block';
        toggle.textContent = 'hide forecast';
    }else{
        d.style.display = 'none';
        toggle.textContent = 'show forecast';
    }
}

function toggleMain(){
    let z = document.getElementById('logo');
    let m = document.getElementById('main');
    console.log(m.style.display);
    if(m.style.display === 'none'){
        m.style.display = 'block';
        z.style.display = 'none'
    }else{
        m.style.display = 'none';
        z.style.display = 'block';
    }
}


////////////////////////
//Zip code submit form//
////////////////////////

//Handles zip code form - Takes a zip code and returns the longitude and lattitude. Calls 'storeFavorites' to store 
//the zip, longitude, and lattitude. Then calls 'latLon' to use the longitude and lattitude data to get the 5 day forecast.
zip.addEventListener('submit', e => {
    e.preventDefault();
    let inputZip = e.target.zipCode.value;
    console.log(inputZip);
    fetchCoordinatesByZip(inputZip)
    .then (geoData => {
        toggleMain();
        fetchAndRender(geoData);
        saveDataForZip(inputZip, geoData);
    })
    .catch (error => console.log(error));
});

function fetchAndRender (geoData) {
    fetchWeatherByLatLon(geoData.lat, geoData.lon)
        .then(weatherData => {
            city = weatherData.name;
            displayDetails(weatherData)});
    fetchForecastByLatLon(geoData.lat, geoData.lon)
        .then(forecastData => {
            storeForecast(forecastData);
            renderForecastMenu();
        });
}

function getSavedGeoData (zipCode) {
    return fetch(`http://localhost:3000/zipcodes/${zipCode}`)
    .then (response => response.json())
}

function saveDataForZip (zipCode, data) {
    if (repeatZip === false) {
        saveLocations(data);
        popDropDown(data);
    } else {
        repeatZip = false;
        console.log('Zip already exists');
    }
}


// OPEN WEATHER API CALLS

// gets latitude & longitude using zip code
function fetchCoordinatesByZip (zipCode) {
    return fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${API_KEY}`)
    .then(res => {
        if (res.ok) {
            //city = res
            return res.json()
        }

        throw new Error('Not a valid zip code');
    })
    .catch (error => console.log(error));
}

// gets current weather using latitude & longitude
function fetchWeatherByLatLon (lat, lon) {
    return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`)
    .then(res => res.json());
}

// gets forecasted weather using latitude & longitude
function fetchForecastByLatLon (lat, lon) {
    return fetch (`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`)
    .then(res => res.json());
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
    });
}





//////////////////
//Drop-down List//
//////////////////

//On page load/refresh, it pulls the info stored in the db.json file, and sends it to the 'popDropDown' function to
//populate the drop down list. 
fetch('http://localhost:3000/zipcodes')
.then(res => res.json())
.then(data => data.forEach(zip => popDropDown(zip.geoData)));

//Populates the favorites drop-down menu every time a zip code is entered. 
function popDropDown(data){
    const opt = document.createElement('option');
    opt.value = data.zip;
    opt.textContent = `${data.zip} -- ${data.name}`;
    localDropDown.append(opt);
}

//Stores the location's data in the db.json file to persist the list, and be able to recall the already searched zipcodes.
function saveLocations (data) {
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
    })
    .then(res => res.json())
}

//Handles the drop-down menu of previously searched zip codes. (still needs to call a renderingfunction to put display 
//the data in the days menu, and the details section).
const localDropDown = document.querySelector('#favLocation');
localDropDown.addEventListener('change', e => selectFav(e));
function selectFav(e){
    const selection = e.target.value;
    if (selection !== "") {
        repeatZip = true;
        getSavedGeoData(selection)
        .then(zipData => {
            fetchAndRender(zipData.geoData);
        })
        .catch(error => console.log(error));
    } else {
        console.log('blank selected');
    }
}




///////////////////////////////////////////////////////
//Render the info to the day menu and details section//
///////////////////////////////////////////////////////

//display the details of the selected day
const details = document.querySelector('#details ul');
const detailsCity = document.getElementById('details-city-name');
const detailsIcon = document.getElementById('details-weather-icon');
function displayDetails(data){
    //HTML Elements
    details.innerHTML = ''
    changeBackground(data.weather[0].id)                   //new
    const iconImg = document.createElement('p')           //new
    const img = document.createElement('img')              //new
    const windSpeed = document.createElement('li')
    const temperature = document.createElement('li')
    const weatherDescription = document.createElement('p')
    const feelsLike = document.createElement('li')
    const highTemp = document.createElement('li')
    const lowTemp = document.createElement('li')
    const humidity = document.createElement('li')

    img.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png` //new
    iconImg.append(img)                                                         //new
    humidity.textContent = `Humidity: ${data.main.humidity}%`
    highTemp.textContent = `High: ${data.main.temp_max} F`
    lowTemp.textContent = `Low: ${data.main.temp_min} F`
    feelsLike.textContent = `Feels Like: ${data.main.feels_like} F`
    weatherDescription.textContent = data.weather[0].description
    temperature.textContent = `Temperature: ${data.main.temp} F`
    windSpeed.textContent = `Wind Speed: ${data.wind.speed} MPH`

    detailsCity.textContent = city;
    detailsIcon.append(iconImg, weatherDescription);


    details.append(humidity, highTemp, lowTemp, feelsLike, windSpeed, temperature); //new added iconImg
    console.log(data);
};

//Select day from day menu

forecastMenu.addEventListener('click', e => {
    const dayIndex = e.target.value;
    displayDetails(FORECAST_ARY[dayIndex][1])
    console.log(FORECAST_ARY[dayIndex]);
});

//Changes the backgound image of the details based on the weather description     //new
function changeBackground(id){
    let img;
    let num = String(id).charAt(0);
    num = Number(num);
    if(id === 800){
        img = 'sunnySky.png';
    }else{
        switch(num){
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