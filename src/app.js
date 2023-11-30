// IMPORTS PAQUETES Y MODULOS

import express, { urlencoded } from "express";
import __dirname from "./utils.js";
import handlebars from "express-handlebars";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { errorMiddleware } from './errors/error.middleware.js'
import { addLogger } from "./logs/logger.config.js";

// IMPORT VARIABLES DE ENTORNO

import config from "./config.js";

// IMPORTS RUTAS

import productsRouter from "./routes/products.router.js";
import sessionRouter from './routes/session.router.js';
import cartRouter from "./routes/cart.router.js";
import viewsRouter from "./routes/views.router.js";
import msmRouter from "./routes/message.router.js";
import ticketRouter from "./routes/ticket.router.js";
import mockRouter from "./routes/mock.router.js";
import loggerRouter from './routes/loggerTest.router.js'

// IMPORTS CONTROLLERS

import ViewsController from "./controllers/viewsController.js";

// IMPORT COOKIES

import cookieParser from "cookie-parser";

// IMPORTS PASSPORT
import passport from "passport";
import { initializePassportLocal } from "./config/local.passport.js";
import { initializePassportGitHub } from "./config/gitHub.passport.js";
import { initializePassportJWT } from "./config/jwt.passport.js";

// IMPORTS SWAGGER:

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';

// SERVER EXPRESS

const app = express();

// MONGOOSE

const connection = mongoose.connect(config.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// MIDDLEWARES

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.use(errorMiddleware);
app.use(addLogger);
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

// PASSPORT

app.use(cookieParser(config.FIRMA_COOKIE));
app.use(passport.initialize());
initializePassportJWT();
initializePassportGitHub();
initializePassportLocal();

// SWAGGER

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MECATRON - INFO',
      description: 'Informacion sobre E-Commerce MECATRON - Repuestos para automóviles',
    },
  },
  apis: [`${__dirname}/docs/**/*.yaml`]
}
const specs = swaggerJSDoc(swaggerOptions)

app.use('api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs))

// SERVER HTTP EXPRESS

const expressServer = app.listen(config.PORT, () => {
  console.log(`Servidor levantado en el puerto ${config.PORT}`);
});

// SERVER SOCKET.IO

const socketServer = new Server(expressServer);

// VIEWS CONTROLLER

let viewsController = new ViewsController();

// SERVER SOCKET.IO EVENTS

socketServer.on("connection", async (socket) => {
  console.log("¡Nuevo cliente conectado!", socket.id);

  // PRODUCTS

  const productsResponse = await viewsController.getAllProductsControllerV();
  socket.emit("products", productsResponse.result);

  socket.on("busquedaFiltrada", async (busquedaProducts) => {
    const { limit, page, sort, filtro, filtroVal } = busquedaProducts;
    const productsResponse = await viewsController.getAllProductsControllerV(limit, page, sort, filtro, filtroVal);
    socket.emit('products', productsResponse.result);
  });

  // MESSAGES:

  const messages = await viewsController.getAllMessageControllerV();
  socket.emit("messages", messages.result);
});

// MIDDLEWARE

app.use((req, res, next) => {
  req.socketServer = socketServer;
  next();
});

// ROUTES

app.use("/", viewsRouter);
app.use("/api/chat", msmRouter);
app.use("/api/carts", cartRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/products", productsRouter);
app.use("/api/tickets", ticketRouter);
app.use("/mockProducts", mockRouter);
app.use('/loggerTest', loggerRouter);
