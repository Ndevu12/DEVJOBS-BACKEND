import express, { Application, Request } from "express";
import cors from "cors";
import router from "./routes";
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';


dotenv.config();
const app: Application = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
  };

app.use(cors(corsOptions));
app.use(express.json());

// Morgan format for logging
const morganFormat = ':method :url :status :response-time ms - :res[content-length]';
app.use(morgan(morganFormat));

app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

app.use(router);

// morgan.format('myformat )
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on the port: http://localhost:${PORT}`);

})