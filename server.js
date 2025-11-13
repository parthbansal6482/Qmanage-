require('dotenv').config();

const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/database');
const webRoutes = require('./routes/webRoutes');
const apiRoutes = require('./routes/api');

const app = express();

// Database
connectDB();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, 'public')));

// Expose app locals for use in templates
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.site = {
    name: 'Qmanage',
  };
  next();
});

// Routes
app.use('/', webRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res, next) => {
  if (req.accepts('html')) {
    return res.status(404).render('404', {
      title: 'Page Not Found',
      message: 'The page you are looking for does not exist.',
    });
  }

  if (req.accepts('json')) {
    return res.status(404).json({ message: 'Not found' });
  }

  return res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    err.message || 'Something went wrong. Please try again later.';

  if (req.accepts('html')) {
    return res.status(status).render('500', {
      title: 'Server Error',
      message,
    });
  }

  return res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

