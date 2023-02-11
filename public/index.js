let mainButtons = document.querySelectorAll('div.uiAnimation');
let subButtons = document.querySelectorAll('div.fadeIn');
let options = document.getElementsByClassName('settingFade')
let selectExtensionButton = document.getElementById('selectExtensionsButton');
let optionsButton = document.getElementById('settingsButton');
let settingsPanel = document.getElementById('settingsPanel');
let chatMessages = document.getElementById('chatMessages')
let eventBox = document.getElementById('eventMessages');
let submitNewUser = document.getElementById('newHandleToServer');
let unameBox = document.getElementById('handleInput');
let chatGreenButton = document.getElementById('chatColor');

let roleColors = {
    "baseViewer": "#ffb88f",
    "follower": "#94ff2f",
    "subscriber": "#ff43c0",
    "moderator": "#4a83ff"
}
// UI HANDLING
selectExtensionButton.addEventListener('click', () => {

    if (settingsPanel.classList.contains('settingsBoxOut')) {

        optionsButton.classList.toggle('rotateButton');
        settingsPanel.classList.toggle('settingsBoxOut');

        for (const element of options) {
            element.classList.toggle('settingsVisible');
        }

    }

    for (const element of mainButtons) {
        element.classList.toggle("newState")
    }

    for (const element of subButtons) {
        element.classList.toggle("buttonsVisible")
    }

})

optionsButton.addEventListener('click', () => {

    if (selectExtensionButton.classList.contains('newState')) {
        for (const element of mainButtons) element.classList.toggle('newState')
        for (const element of subButtons) element.classList.toggle('buttonsVisible')
    } settingsPanel.classList.toggle('settingsBoxOut');
    optionsButton.classList.toggle('rotateButton');

    for (const element of options) {
        element.classList.toggle('settingsVisible');
    }
})

submitNewUser.addEventListener('click', () => {
    let newName = unameBox.value;
    if (newName == null || newName == "") {
        unameBox.placeholder = "Please add a username and try again."
        unameBox.value = ""
        return
    }
    socket.emit('updateUName', newName);
    unameBox.value = ""
    unameBox.placeholder = "Type your handle without the '@'."
    unameBox.value = ""
})

unameBox.onkeydown = function (e) {
    if (e.key == "Enter") {
        let newName = unameBox.value;
        if (newName == null || newName == "") {
            unameBox.placeholder = "Please add a username and try again."
            unameBox.value = ""
            return
        }
        socket.emit('updateUName', newName);
        unameBox.value = ""
        unameBox.placeholder = "Type your handle without the '@'."
        unameBox.value = ""
    }
}

chatGreenButton.addEventListener('click', () => {

    document.getElementById('subContainer').classList.toggle('toggleColor');
    if (document.getElementById('subContainer').classList.contains('toggleColor')) {
        chatGreenButton.value = 'Toggle Green: On'
    } else chatGreenButton.value = 'Toggle Green: Off'

})

function updateViewCount(input) {
    let viewerCount = JSON.parse(input).viewerCount;
    let viewBox = document.getElementById('viewerCount');
    viewBox.innerHTML = `🔴 ${viewerCount}`

}

function pushChat(input) {
    let chatData = JSON.parse(input);
    let newMsg = document.createElement('li');
    let newPfp = document.createElement('img');
    let displayName = document.createElement('p');
    let nameColor = colorName(chatData.roles);
    newPfp.src = chatData.pfp;
    newPfp.style.width = '14px';
    newPfp.style.height = '14px';
    displayName.style.color = roleColors[nameColor];
    displayName.innerHTML = " " + chatData.uName
    displayName.style.display = "inline"
    displayName.prepend(newPfp)
    newMsg.append(displayName, document.createTextNode(': ' + chatData.content))
    chatMessages.appendChild(newMsg)
    chatMessages.scrollTop = chatMessages.scrollHeight - chatMessages.clientHeight;
}

function updateEventList(input) {
    let payload = JSON.parse(input);
    let name = payload.uName;
    let uRoles = payload.roles;
    let event = payload.type;
    let eventList = "";

    switch (event) {

        case "share":
            eventList += ` Has just shared the stream!`
            break;
        case "follow":
            eventList += ` Has just followed the stream!`
            updateStats(input);
            break;
        case "newSub":
            eventList += ` Has just subscribed to the stream! [Current Streak: ${payload.subStreak}]`;
            break;
        case "coinDonation":
            eventList += ` Just gifted ${payload.giftName} x${payload.amount}! (${payload.value} coins)`
            break;
    }

    if (payload.type === "updateLikes") {
        updateStats(input);
    } else {

        let newEvent = document.createElement('li');
        let displayName = document.createElement('p')
        displayName.style.color = roleColors[colorName(uRoles)];
        displayName.style.display = "inline";
        displayName.innerHTML = " " + name;
        newEvent.append(displayName, document.createTextNode(eventList))
        eventBox.appendChild(newEvent)

        eventBox.scrollTop = eventBox.scrollHeight - eventBox.clientHeight;
    }
}

function updateStats(input) {
    let stats = JSON.parse(input)
    let followCounter = document.getElementById('followCount');
    let likesCounter = document.getElementById('likeCount');
    if (stats.type === "follow") {
        followCounter.innerHTML = `👤 ${stats.newFollows}`
    }
    if (stats.type === "updateLikes") {
        likesCounter.innerHTML = `👍 ${stats.newLikes}`
    }
}

function colorName(userRoles) {

    if (userRoles[0] == true) {
        return 'moderator'
    } else if (userRoles[1] == true) {
        return 'subscriber'
    } else if (userRoles[2] == 1) {
        return 'follower'
    } else return 'baseViewer'

}

// SOCKETS

socket.on('liveConnectSuccess', (data) => {
    document.getElementById('currentChannel').innerHTML = `Currently Connected:<br>${data}`
})

socket.on('eventToClient', (data) => {
    updateEventList(data);
})

socket.on('newChat', (data) => {
    pushChat(data);
})

socket.on('updateViewerCount', (data) => {
    updateViewCount(data);
})
