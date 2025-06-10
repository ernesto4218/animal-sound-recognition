import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import cookieParser from 'cookie-parser';
import {
  getAllConfigs,
  getAllUploadedModels,
  getAllUploadedPhotoClass,
  getAllDetectedLogs,
  checkauth,
} from './db/services.js';

const app = express();
const port = 3003;

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/home', async (req, res) => {
  const token = req.cookies.auth_token;
  console.log(token);
  if (!token) {
    return res.redirect('login');
  }

  const auth = await checkauth(token);
  console.log(auth);
  if (!auth){
    return res.redirect('login');
  }

  const systemSettings = await getAllConfigs();
  const uploadedPhotoClass = await getAllUploadedPhotoClass();

  // console.log(uploadedPhotoClass);
  const header = {
    date: getFormattedTime(),
    name: `${getGreeting()}, ${auth.first_name}`,
    title: "Dashboard",
  }

  res.render('home', {header : header, settings: systemSettings, animal_photos: uploadedPhotoClass});
});

app.get('/settings', async (req, res) => {
  const token = req.cookies.auth_token;
  
  console.log(token);
  
  if (!token) {
    return res.redirect('login');
  }

  const auth = await checkauth(token);
  console.log(auth);
  if (!auth){
    return res.redirect('login');
  }

  const systemSettings = await getAllConfigs();
  const uploadedfiles = await getAllUploadedModels();
  const uploadedPhotoClass = await getAllUploadedPhotoClass();

  console.log(uploadedPhotoClass);

  const header = {
    date: getFormattedTime(),
    name: `${getGreeting()}, ${auth.first_name}`,
    title: "System Settings",
  }

  res.render('settings', {header : header, settings: systemSettings, files: uploadedfiles, photos: uploadedPhotoClass});
});

app.get('/analytics', async (req, res) => {
  const token = req.cookies.auth_token;
  console.log(token);
  if (!token) {
    return res.redirect('login');
  }

  const auth = await checkauth(token);
  console.log(auth);
  if (!auth){
    return res.redirect('login');
  }

  const detected_lgogs = await getAllDetectedLogs();

  const header = {
    date: getFormattedTime(),
    name: `${getGreeting()}, ${auth.first_name}`,
    title: "Analytics",
  }

  res.render('analytics', {header : header, logs: detected_lgogs});
});

app.get('/profile', async (req, res) => {
  const token = req.cookies.auth_token;
  console.log(token);
  if (!token) {
    return res.redirect('login');
  }

  const auth = await checkauth(token);
  console.log(auth);
  if (!auth){
    return res.redirect('login');
  }

  const formattedAuth = {
    ...auth,
    last_signin: formatDate(auth.last_signin),
    last_updated: formatDate(auth.last_updated),
    date_added: formatDate(auth.date_added),
  };

  const header = {
    date: getFormattedTime(),
    name: `${getGreeting()}, ${formattedAuth.first_name}`,
    title: "Account Information",
  }

  res.render('profile', {header: header, account: formattedAuth});
});

app.get('/recognition', async (req, res) => {
  const token = req.cookies.auth_token;
  console.log(token);
  if (!token) {
    return res.redirect('login');
  }

  const auth = await checkauth(token);
  console.log(auth);
  if (!auth){
    return res.redirect('login');
  }

  const formattedAuth = {
    ...auth,
    last_signin: formatDate(auth.last_signin),
    last_updated: formatDate(auth.last_updated),
    date_added: formatDate(auth.date_added),
  };

  const header = {
    date: getFormattedTime(),
    name: `${getGreeting()}, ${formattedAuth.first_name}`,
    title: "Sound Recognition",
  }

  res.render('recognition', {header: header, account: formattedAuth});
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('login');
});


app.get('/', (req, res) => {
  res.redirect('home');
});

app.get('/sample', (req, res) => {
  res.render('sample1');
});


app.use('/api', apiRouter);

// cdn
app.use('/cdn/', express.static(path.join(__dirname, 'node_modules/')));
app.use('/machinelearning/', express.static(path.join(__dirname, 'ml/model/')));
app.use('/downloadmachinelearning/', express.static(path.join(__dirname, 'ml/zip/')));
app.use('/photoclass/', express.static(path.join(__dirname, 'uploaded_photo_class')));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

//helper
function getFormattedTime() {
  const now = new Date();

  // Day of the week, e.g., 'Wed'
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });

  // Month, e.g., 'May'
  const month = now.toLocaleDateString('en-US', { month: 'short' });

  // Day of the month, e.g., '28'
  const day = now.getDate();

  // Time in hours and minutes with AM/PM, e.g., '9:12 AM'
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${weekday} ${month} ${day} ${time}`;
}

function formatDate(date) {
  if (!date) return null;
  return new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}