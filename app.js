const express = require('express');
const { stat } = require('fs');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server)
const port = process.env.PORT || 3000;

const { WebcastPushConnection } = require('tiktok-live-connector');
let tiktokUsername = '';
let connectedFlag = false;

//Socket Routing
io.on('connection', (socket) => {
    socket.on('updateUName', (data) => {
        newConnection(data, function (cbValue) {

            let payload = JSON.stringify(cbValue);

            if (cbValue.type === "updateViewerCount") {
                socket.emit('updateViewerCount', payload)
            } else if (cbValue.type === "incomingChat") {
                socket.emit('newChat', payload)
            } else {
                if (cbValue.type === 'newSub') socket.emit('subToTimer', payload)
                if (cbValue.type === 'follow') socket.emit('followToTimer', payload)
                socket.emit('eventToClient', payload)
            }

        })
        socket.emit('liveConnectSuccess', data);
    })

})

function newConnection(username, callback) {

    var tiktokLiveConnection = new WebcastPushConnection(username, {
        enableExtendedGiftInfo: true,
        fetchRoomInfoOnConnect: true
    });

    tiktokLiveConnection.connect().then(state => {
        console.info(`Connected to room (ID): ${state.roomId}`)
        tiktokUsername = username;
        connectedFlag = true;
    }).catch(err => {
        console.error('Failed to connect', err)
    })





    // TIKTOK EVENTS GO HERE

    tiktokLiveConnection.on('roomUser', data => {
        let cbValue = {
            type: 'updateViewerCount',
            viewerCount: data.viewerCount
        }
        callback(cbValue);
    })

    tiktokLiveConnection.on('error', err => {
        console.log('Error: ', err)
    })

    tiktokLiveConnection.on('streamEnd', (actionId) => {
        if (actionId === 3) {
            console.log('Stream ended by user');
        }
        if (actionId === 4) {
            console.log('Stream ended by platform moderator (ban)');
        }
    })

    tiktokLiveConnection.on('gift', data => {
        if (data.giftType === 1 && !data.repeatEnd) {
        } else {
            console.log(`Recieved ${data.repeatCount} ${data.giftName}\'s from ${data.uniqueId}`)
            let coins = Number(data.diamondCount);
            let cbValue = {
                type: 'coinDonation',
                value: coins,
                uName: data.uniqueId,
                roles: [data.isModerator, data.isSubscriber, data.rollowRole],
                pfp: data.userDetails.profilePictureUrls[2],
                giftName: data.giftName,
                amount: data.repeatCount
            };
            callback(cbValue)
        }
    })

    tiktokLiveConnection.on('subscribe', (data) => {
        let cbValue = {
            type: 'newSub',
            uName: data.uniqueId,
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            pfp: data.userDetails.profilePictureUrls[2],
            subStreak: data.subMonth,

        };
        callback(cbValue);
    })

    tiktokLiveConnection.on('follow', (data) => {


        tiktokLiveConnection.getRoomInfo().then(roomInfo => {

            let cbValue = {
                type: 'follow',
                uName: data.uniqueId,
                roles: [data.isModerator, data.isSubscriber, data.rollowRole],
                pfp: data.userDetails.profilePictureUrls[2],
                newFollows: roomInfo.stats.follow_count,
            }

            callback(cbValue)

        })

    })

    tiktokLiveConnection.on('like', (data) => {

        let cbValue = {
            type: "updateLikes",
            newLikes: data.totalLikeCount
        }


        callback(cbValue)


    })

    tiktokLiveConnection.on('share', (data) => {
        let cbValue = {
            type: 'share',
            uName: data.uniqueId,
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            pfp: data.userDetails.profilePictureUrls[2]
        }


        callback(cbValue)


    })

    tiktokLiveConnection.on('chat', data => {
        let cbValue = {
            type: 'incomingChat',
            uName: data.uniqueId,
            pfp: data.userDetails.profilePictureUrls[2],
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            content: data.comment
        }
        callback(cbValue);
    })
}





// RUNNING THE SERVER

server.listen(port, () => {
    console.log(`listening at: http://localhost:${port}`)

})
