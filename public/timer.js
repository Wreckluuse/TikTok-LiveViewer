let hours = 0,
    minutes = 0,
    seconds = 0,
    displayHours = 0,
    displayMin = 0,
    displaySec = 0;

let modifier = 3;

let clock = document.getElementById('time');
let startButton = document.getElementById('startButon');
let stopButton = document.getElementById('pauseButton');

let dropdown = document.getElementById('dropdownContent');
let manualInput = document.getElementById('manualCustom');
let manualSubmit = document.getElementById('manualSub');

let initialized = false;

let state = 'stopped';

let colorWell;
const defaultColor = "#232324";

window.addEventListener("load", initColor, false);

function initColor() {
    colorWell = document.getElementById("colorPicker");
    colorWell.value = defaultColor;
    colorWell.addEventListener("input", updateFirst, false);
    colorWell.addEventListener("change", updateAll, false);
    colorWell.select();
}

function updateFirst(event) {
    const disp = document.getElementById('display');
    if (disp) {
        disp.style.backgroundColor = event.target.value;
    }
}

function updateAll(event) {
    const disp = document.getElementById('display');
    disp.style.backgroundColor = event.target.value;
}

let slider = document.getElementById('coinModifier');
let sliderValue = document.getElementById('cps');
slider.oninput = function () {
    sliderValue.value = this.value;
    modifier = this.value;
}
sliderValue.oninput = function () {
    slider.value = this.value;
    modifier = slider.value;
}
let followSlider = document.getElementById('followModifier');
let followValue = document.getElementById('spf');
let followModifier = 3;
followSlider.oninput = function () {
    followValue.value = this.value;
    followModifier = followSlider.value;
}

followValue.oninput = function () {
    followSlider.value = this.value;
    followModifier = followSlider.value;
}


function startClock() {
    if (state == 'stopped') {
        state = 'started';
        if (initialized === false) {
            if (document.getElementById('initTime').value != "") {
                clock.style.visibility = 'visible'
                document.getElementById('initTime').style.display = 'none';
                document.getElementById('display').style.backgroundColor = '#00ff37';
                document.getElementById('timerControls').style.height = "fit-content";
                document.getElementById('timerControls').style.paddingBottom = "10px";
                document.getElementById('timerControls').style.width = "60%";
                initialized = true;
                hours = document.getElementById('initTime').value;
                interval = window.setInterval(timer, 1000);
            } else state = 'stopped'
        } else {
            interval = window.setInterval(timer, 1000);
        }

    }
}

function timer() {
    if (seconds == 0) {
        if (minutes == 0) {
            hours--;
            minutes = 59;
        } else minutes--;
        seconds = 59;
    } else {
        seconds--;
    }
    if (seconds < 10) {
        displaySec = "0" + seconds.toString();
    }
    else {
        displaySec = seconds;
    }

    if (minutes < 10) {
        displayMin = "0" + minutes.toString();
    }
    else {
        displayMin = minutes;
    }

    if (hours < 10) {
        displayHours = "0" + hours.toString();
    }
    else {
        displayHours = hours;
    }

    //Display updated time values to user
    document.getElementById("time").innerHTML = displayHours + ":" + displayMin + ":" + displaySec;
}

function stop() {
    if (state == 'started') {
        state = 'stopped';
        window.clearInterval(interval);
    }
}


function plus1m() {
    if (minutes + 1 >= 60) {
        minutes = 0;
        hours += 1;
    } else minutes += 1;
}

function plus1h() {
    hours += 1;
}

function addCustomTime(input = Number(manualInput.value)) {
    if (Number.isInteger(input)) {
        let amount = input;
        if (amount + minutes >= 60) {
            hours += 1
            minutes = (amount + minutes) - 60;
        }
        else minutes += amount;
    }
    manualInput.value = '';
}

function addCustomSeconds(input) {
    if (seconds + input >= 60) {
        if (minutes + 1 >= 60) {
            hours += 1;
            minutes = 0;
            seconds = 0;
        } else {
            minutes += 1;
            seconds = (seconds + input) - 60;
        }
    }
}

function hookTime(hookInput) {
    //let hookMinutes = Math.floor(Math.floor(hookInput / modifier) / 60);
    hookSeconds = Math.round(hookInput / modifier)
    if (hookSeconds >= 60) {
        let hookMinutes = Math.floor(hookSeconds / 60);
        hookSeconds = Math.floor(hookSeconds % 60)
        if (hookMinutes >= 60) {
            let hookHours = Math.floor(hookMinutes / 60);
            hookMinutes = Math.floor(hookMinutes % 60)
            hours += hookHours;
            minutes = hookMinutes;
        } else {
            addCustomTime(hookMinutes);
            seconds = hookSeconds;
        }
    } else {
        if (seconds + hookSeconds >= 60) {
            if (minutes + 1 >= 60) {
                hours += 1;
                minutes = 0;
            } else minutes += 1;
            seconds = (seconds + hookSeconds) - 60;
        } else {
            seconds += hookSeconds;
        }

    }

}

manualInput.onkeydown = function (e) {
    if (e.key == 'Enter') {
        addCustomTime();
    }
}

socket.on('dataToTimer', (data) => {
    data = JSON.parse(data)
    if (data.value >= modifier) hookTime(data.value)
})

socket.on('subToTimer', () => {
    addCustomTime(5)
})

socket.on('followToTimer', () => {
    addCustomSeconds(followModifier);
})
