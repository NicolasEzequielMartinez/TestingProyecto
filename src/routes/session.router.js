import { Router } from "express";
import passport from "passport";
import {completeProfile} from '../config/formExtra.js'
import { registerUser, loginUser, getCurrentUser, authenticateWithGitHub, getProfileUser} from './middlewares/passport.middleware.js';
import SessionController from '../controllers/sessionController.js';

const sessionRouter = Router();
let sessionController = new SessionController();

// REGISTRO
sessionRouter.post('/register', registerUser);

//LOGIN
sessionRouter.post('/login', loginUser);

// GITHUB
sessionRouter.get('/github', passport.authenticate('github', { session: false, scope: 'user:email' }));
sessionRouter.get('/githubcallback', authenticateWithGitHub);

// FORMULARIO COMPLETO
sessionRouter.post('/completeProfile', completeProfile);

// CURRENT
sessionRouter.get('/current', passport.authenticate('jwt', { session: false }), getCurrentUser);

// PERFIL USUARIO
sessionRouter.get('/profile', passport.authenticate('jwt', { session: false }), getProfileUser);

// EMAIL RESET PASS:
sessionRouter.post('/requestResetPassword', async (req, res, next) => {
    const result = await sessionController.resetPass1Controller(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

// RESET USER PASS:
sessionRouter.post('/resetPassword', passport.authenticate('jwt', {
        session: false
    }),
    async (req, res, next) => {
        const result = await sessionController.resetPass2Controller(req, res, next);
        if (result !== undefined) {
            res.status(result.statusCode).send(result);
        };
    });

// USER ROL: 
sessionRouter.post('/premium/:uid', async (req, res, next) => {
    const result = await sessionController.changeRoleController(req, res, next);
    if (result !== undefined) {
        res.status(result.statusCode).send(result);
    };
});

export default sessionRouter;