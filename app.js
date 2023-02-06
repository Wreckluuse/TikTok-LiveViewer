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
        newConnection(data, function (cbValue, cbStats) {
            if (cbValue.type === 'notSet') {
                return
            } else {

                let payload = JSON.stringify(cbValue);
                let stats = JSON.stringify(cbStats);
                
                socket.emit('updateStats', stats)

                if (cbValue.type === "updateViewerCount") {
                    socket.emit('updateViewerCount', payload)
                } else if (cbValue.type === "incomingChat") {
                    socket.emit('newChat', payload)
                } else {
                    if (cbValue.type === 'newSub') socket.emit('subToTimer', payload)
                    socket.emit('eventToClient', payload)
                }

               

            }
        })
        socket.emit('liveConnectSuccess', data)
    })
})

function newConnection(username, callback) {
    let cbValue = { type: 'notSet' };
    let cbStats = {
        type: 'updateStats'
    }

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
        cbValue = {
            type: 'updateViewerCount',
            viewerCount: data.viewerCount
        }
        callback(cbValue);
        cbValue = {
            type: 'notSet'
        }
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
            let coins = Number(data.diamondCount) * 2;
            cbValue = {
                type: 'coinDonation',
                value: coins,
                uName: data.uniqueId,
                roles: [data.isModerator, data.isSubscriber, data.rollowRole],
                pfp: data.userDetails.profilePictureUrls[2],
                giftName: data.giftName,
                amount: data.repeatCount
            };
            callback(cbValue)
            cbValue = {
                type: 'notSet'
            };
        }
    })

    tiktokLiveConnection.on('subscribe', (data) => {
        cbValue = {
            type: 'newSub',
            uName: data.uniqueId,
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            pfp: data.userDetails.profilePictureUrls[2],
            subStreak: data.subMonth,

        };
        callback(cbValue);
        cbValue = {
            type: 'notSet'
        };
    })

    tiktokLiveConnection.on('follow', (data) => {
        cbValue = {
            type: 'follow',
            uName: data.uniqueId,
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            pfp: data.userDetails.profilePictureUrls[2],
        }
        callback(cbValue)
        cbValue = {
            type: 'notSet'
        }
    })

    tiktokLiveConnection.on('like', (data) => {
        cbValue = {
            type: 'like',
            totalLikes: data.totalLikeCount
        }
        callback(cbValue)
        cbValue = {
            type: 'notSet'
        }
    })

    tiktokLiveConnection.on('share', (data) => {
        cbValue = {
            type: 'share',
            uName: data.uniqueId,
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            pfp: data.userDetails.profilePictureUrls[2]
        }
        callback(cbValue)
        cbValue = {
            type: 'notSet'
        }
    })

    tiktokLiveConnection.on('chat', data => {
        cbValue = {
            type: 'incomingChat',
            uName: data.uniqueId,
            pfp: data.userDetails.profilePictureUrls[2],
            roles: [data.isModerator, data.isSubscriber, data.rollowRole],
            content: data.comment
        }
        callback(cbValue);
        cbValue = {
            type: 'notSet'
        };
    })

    tiktokLiveConnection.getRoomInfo().then(roomInfo => {
        cbStats = {
            type: "updateInfo",
            newFollows: roomInfo.stats.follow_count,
            newLikes: roomInfo.stats.like_count
        }
        callback(cbStats)
    })

}

// RUNNING THE SERVER

server.listen(port, () => {
    console.log(`listening at: http://localhost:${port}`)

})
