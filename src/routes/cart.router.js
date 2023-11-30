import { Router } from "express";
import CartController from "../controllers/cartController.js";
import passport from "passport";

import { rolesMiddlewareUser } from "./middlewares/roles.middleware.js";
import { verificarPertenenciaCarrito } from "./middlewares/carts.middleware.js";

const cartRouter = Router();
let cartController = new CartController();


cartRouter.post("/", async (req, res) => {
  const result = await cartController.createCartController(req, res);
  res.status(result.statusCode).send(result);
});

cartRouter.get("/:cid", async (req, res, next) => {
  const result = await cartController.getCartByIdController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
});

cartRouter.get('/', async (req, res) => {
  const result = await cartController.getAllCartsController(req, res);
  res.status(result.statusCode).send(result);
});

cartRouter.post('/:cid/products/:pid/quantity/:quantity', passport.authenticate('jwt', { session: false }), rolesMiddlewareUser, verificarPertenenciaCarrito, async (req, res, next) => {
  const result = await cartController.addProductInCartController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
});

cartRouter.post('/:cid/purchase', passport.authenticate('jwt', { session: false }), rolesMiddlewareUser, async (req, res, next) => {
  const result = await cartController.purchaseProductsInCartController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
})

cartRouter.delete('/:cid/products/:pid', passport.authenticate('jwt', { session: false }), rolesMiddlewareUser, async (req, res, next) => {
  const result = await cartController.deleteProductFromCartController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
})

cartRouter.delete('/:cid', passport.authenticate('jwt', { session: false }), rolesMiddlewareUser, async (req, res, next) => {
  const result = await cartController.deleteAllProductsFromCartController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
});

cartRouter.put('/:cid', passport.authenticate('jwt', { session: false }), rolesMiddlewareUser, verificarPertenenciaCarrito, async (req, res, next) => {
  const result = await cartController.updateCartController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
});

cartRouter.put('/:cid/products/:pid', passport.authenticate('jwt', { session: false }), rolesMiddlewareUser, async (req, res, next) => {
  const result = await cartController.updateProductInCartController(req, res, next);
  if(result !== undefined) {
    res.status(result.statusCode).send(result);
  };
});

export default cartRouter;