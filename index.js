const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const { dbConnectionString } = require('./config');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = 3000;

// Connect to MongoDB
mongoose.connect(dbConnectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    // app.listen(port, () => {
    //   console.log(`Server is running on port ${port}`);
    // });
    app.listen(port,() => console.log('Server is started ✔ http://localhost:'+port));
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });



// Routes
app.use('/api/users', userRoutes);

module.exports = app;
