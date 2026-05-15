const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./src/config/db');
const errorMiddleware = require('./src/middleware/error');
const userRoutes = require('./src/routes/userRoutes');

const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');

dotenv.config();

connectDB();

const app = express();


app.use(helmet()); 
app.use(express.json()); 
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Blog API" });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));