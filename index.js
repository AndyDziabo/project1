//
//Global variable declaration
//
let zipCodeEntry = 00000;
let lat = 0;
let lon = 0;
let repeatZip = false;

////////////////////////
//Zip code submit form//
////////////////////////

//Handles zip code form - Takes a zip code and returns the longitude and lattitude. Calls 'storeFavorites' to store 
//the zip, longitude, and lattitude. Then calls 'latLon' to use the longitude and lattitude data to get the 5 day forecast.
const zip = document.querySelector('#zip');

zip.addEventListener('submit', e => {
    e.preventDefault();
    zipRequest(e.target.zipCode.value);
});

function zipRequest(zipCode){
    fetch(`http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${apiKEY}`)
    .then(res => {
        if(res.ok){
            return res.json();
        }
        throw new Error('Not a valid zip code');
    })
    .then(data => {
        latLon(data);
        if(repeatZip === false){
            saveLocations(data);
            popDropDown(data);
        }else{
            repeatZip = false;
            console.log('Zip already exists');
        }
    })
    .catch(error => alert('Not a valid zip code'));
}

//Takes the longitude and lattitude and calls a GET request to get the 5 day forecast.(still needs to call a rendering 
//function to put display the data in the days menu, and the details section).
function latLon(data){
    lat = data.lat;
    lon = data.lon;
    fetch(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKEY}&units=imperial`)
    .then(res => res.json())
    .then(data => formatData(data))
    .catch(error => console.error('Error'));
}

function formatData(data) {
    let newData = data;
    console.log(newData);
    displayDetails(newData);
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
        zipRequest(e.target.value);
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
const daysMenu = document.querySelector('#daysMenu');
daysMenu.addEventListener('click', e => console.log(e.target));






