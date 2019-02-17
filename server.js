const express = require('express');
const cors = require('cors');
// socket
const socketIO = require('socket.io');
const notifications = require('./notifications.json');

// image uplaoder
const path = require('path');
const http = require('http');
const multer = require('multer');
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");

let cloudConfig = {};
let inDevMode = true;

try {
	cloudConfig = require('./keys.json');
} catch (error) {
	console.log('Keys not found:', error);
	inDevMode = false;
	// prod
	cloudConfig = {
		cloud_name: 'nowappsstudio',
		api_key: process.env.API_KEY,
		api_secret: process.env.API_SECRET
	};
}

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

cloudinary.config(cloudConfig);

const storage = cloudinaryStorage({
	cloudinary,
	folder: "profile-pictures",
	allowedFormats: [
		"jpg",
		"png"
	],
	transformation: [{
		width: 500,
		height: 500,
		crop: "limit"
	}]
});

const parser = multer({
	storage
});

app.get('/socket-client', (req, res) => res.sendFile(path.resolve(__dirname, 'socket-client.html')));
app.get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'index.html')));

app.post('/api/images', parser.single("image"), (req, res) => {
	console.log("req.file", req.file);

	res.json({
		resp: req.file
	});
});

const server = http.createServer(app);
const io = socketIO(server);
server.listen(PORT);

io.on('connection', (socket) => {
	console.log('Client connected');
	socket.on('disconnect', () => console.log('Client disconnected'));
});

setInterval(() => {
	const toSend = JSON.stringify(notifications.map(n => {
		n.id = new Date().getTime();
		n.date = new Date();
		return n;
	}));

	console.log(`\nNotification: ${toSend}`);
	io.emit('notifications', toSend);
}, inDevMode ? 1000 : 15000);
