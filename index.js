// GLOBAL VARIABLES
let city;
let inputZip;

let FORECAST_ARY = [
    [], [], [], [], [], []  // forecast for today + 5 days
];

// HTML ELEMENTS
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

/////////////////////////
//HTML Element Toggling//
////////////////////////

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

function toggleMain(){
    const logoDiv = document.getElementById('logo');
    const mainDiv = document.getElementById('main');
    if (mainDiv.style.display === 'none') {
        mainDiv.style.display = 'block';
        logoDiv.style.display = 'none'
    }
}


////////////////////////
//Zip code submit form//
////////////////////////

//Handles zip code form - Takes a zip code and returns the longitude and lattitude. Calls 'storeFavorites' to store 
//the zip, longitude, and lattitude. Then calls 'latLon' to use the longitude and lattitude data to get the 5 day forecast.
zip2.addEventListener('submit', e => zipEntered(e));
zip.addEventListener('submit', e => zipEntered(e));


function zipEntered(e){
    e.preventDefault();
    const errorMessage = document.getElementById('errorDisplay');
    inputZip = e.target[0].value;
    if(typeof parseInt(inputZip) !== 'number'){
        errorMessage.innerText = 'Enter a zip code with 5 Numbers';
        setTimeout(function(){
            errorMessage.innerText = '';
        },2000);
    }else if(inputZip.length !== 5){
        errorMessage.innerText = 'Enter a zip code with 5 Numbers';
        setTimeout(function(){
            errorMessage.innerText = '';
        },2000);
    } else {
        fetchCoordinatesByZip(inputZip)
        .then(res => {
            if (res.ok) {
                //city = res
                return res.json()
                //.catch (error => console.log(error));
            }
            throw new Error('Not a valid zip code')
        })
        .then (geoData => {
            toggleMain();
            displayZip(inputZip);
            fetchAndRender(geoData);
            fetchSavedLocations()
            .then(savedZips => {
                console.log(savedZips);
                if (!savedZips.find(entry => entry.id === inputZip)) {
                    saveLocation(geoData);
                    savedZips.push({
                        id: inputZip,
                        geoData: geoData
                    });
                }
                renderLocationMenu(savedZips);
            });
        })
        .catch (error => {
            errorMessage.innerText = 'Not a valid Zip Code';
            setTimeout(function(){
                errorMessage.innerText = '';
            },2000);
        });
    }
};


function displayZip (zipCode) {
    locationBtnDiv.innerHTML = '';
    locationBtnDiv.textContent = zipCode;
}

function fetchSavedLocations () {
    return fetch('http://localhost:3000/zipcodes')     // get zip codes
    .then(res => res.json());
}

function renderLocationMenu (savedZips) {
    locationMenu.innerHTML = '<ul></ul>';   // clear any existing
    savedZips.sort(function(a, b) {         // sort zip codes
        return a.id - b.id;
    });
    savedZips.forEach(entry => {            // for each zip, add to location menu list
        const newLine = document.createElement('li');
        newLine.classList.add('location');
        newLine.textContent = entry.id;
        newLine.addEventListener('click', (event) => {
            displayZip(entry.id);
            fetchAndRender(entry.geoData);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'x';
        deleteBtn.value = entry.id;
        newLine.append(deleteBtn);
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteLocation(event.target.value);
        });

        locationMenu.append(newLine);
    });
}

function toggleDisplay (element) {
    if (element.classList.contains('hide')) {
        element.classList.remove('hide');
    } else {
        element.classList.add('hide');
    }
}

function fetchAndRender (geoData) {
    fetchWeatherByLatLon(geoData.lat, geoData.lon)
        .then(weatherData => {
            city = weatherData.name;
            displayDetails(weatherData)
        });
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


// OPEN WEATHER API CALLS

// gets latitude & longitude using zip code
function fetchCoordinatesByZip (zipCode) {
    return fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${API_KEY}`)
    // .then(res => {
    //     if (res.ok) {
    //         //city = res
    //         return res.json()
    //     }

    //     throw new Error('Not a valid zip code');
    // })
    // .catch (error => console.log(error));
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
            FORECAST_ARY[index].push(entryDayOfWeek.toLowerCase());
        }
        // push forecast data
        FORECAST_ARY[index].push(entry);
    });
}

// RENDER FORECAST MENU WITH DATA

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
    });
}


//Stores the location's data in the db.json file to persist the list, and be able to recall the already searched zipcodes.
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
    .then(res => res.json())
    .then(data => {
        fetchSavedLocations()
        .then(savedZips => {console.log(savedZips[0].geoData)
            locationMenu.innerHTML = '<ul></ul>';
            renderLocationMenu(savedZips);
            fetchAndRender(savedZips[0].geoData);
        });
    });
}


///////////////////////////////////////////////////////
//Render the info to the day menu and details section//
///////////////////////////////////////////////////////

//display the details of the selected day
const detailsList = document.querySelector('#details ul');
const detailsCity = document.getElementById('details-city-name');
const detailsIcon = document.getElementById('details-weather-icon');
function displayDetails(data){
    // clear any existing
    detailsList.innerHTML = '';
    detailsCity.innerHTML = '';
    detailsIcon.innerHTML = '';
    //HTML Elements
    changeBackground(data.weather[0].id)
    const iconImg = document.createElement('p')
    const img = document.createElement('img')
    const windSpeed = document.createElement('li')
    const temperature = document.createElement('li')
    const weatherDescription = document.createElement('p')
    const feelsLike = document.createElement('li')
    const highTemp = document.createElement('li')
    const lowTemp = document.createElement('li')
    const humidity = document.createElement('li')

    img.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    iconImg.append(img)
    humidity.textContent = `Humidity: ${data.main.humidity}%`
    highTemp.textContent = `High: ${data.main.temp_max} F`
    lowTemp.textContent = `Low: ${data.main.temp_min} F`
    feelsLike.textContent = `Feels Like: ${data.main.feels_like} F`
    weatherDescription.textContent = data.weather[0].description
    temperature.textContent = `Temperature: ${data.main.temp} F`
    windSpeed.textContent = `Wind Speed: ${data.wind.speed} MPH`

    detailsCity.textContent = city;
    detailsIcon.append(iconImg, weatherDescription);

    detailsList.append(humidity, highTemp, lowTemp, feelsLike, windSpeed, temperature);
};

//Select day from day menu
forecastMenu.addEventListener('click', e => {
    const dayIndex = e.target.value;
    displayDetails(FORECAST_ARY[dayIndex][1])       // TO-DO : figure out how to consolidate the multiple forecasts for each day
});

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