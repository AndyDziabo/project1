# Weather Forecaster

Bailey Cage, Ben Erkhart, Andy Dziabo

## Description

This app will let a user search the weather for their location.

Users will be able to:
* GET current weather via zip code
* GET forcasted weather data

To view a demo video of the app visit https://andrewdziabo.dev/ and goto the projects section

## Features

* Create layout for displaying weather
* Create form for user entry
    * event listener to submit zip code GET request
* GET current weather via zip code
    * store latitude & longitude for forcast GET request
    * store weather data
    * display weather data
* GET weather forecast via lat & lon
    * store forecast weather data
    * array iteration to display preview
    * event listener to 
        * highlight while hovering?
        * show full details from preview?
    * event listener to display full data for day
* Stretch:
    * event listener to save/persist location
    * event listener to delete saved locations

## Requirements

* 1 public API:  https://openweathermap.org/api/one-call-3
    & https://openweathermap.org/api/geocoding-api
* all actions take place on 1 page
* 3 event listeners:
    1. Submit data(click)
    2. See forecast (click/ mouse)
    3. Change location (click)
* 1 array iteration: preview of forecast
