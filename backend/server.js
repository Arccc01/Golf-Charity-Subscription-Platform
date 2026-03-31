const app = require('./src/app')
const mongoose = require('mongoose')

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch(err => console.error('DB connection failed:', err));

app.listen(5000,()=>{
    console.log("server is running on port 5000")
})