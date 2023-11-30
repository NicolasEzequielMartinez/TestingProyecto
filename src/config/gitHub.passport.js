import passport from 'passport';
import { Strategy as GitHubStrategy} from 'passport-github2';
import config from "../config.js";

import SessionController from '../controllers/sessionController.js';
import CartController from '../controllers/cartController.js';

let sessionController = new SessionController()
const cartController = new CartController();

export const initializePassportGitHub = () => {

    passport.use('github', new GitHubStrategy({
        clientID: config.GITHUB_CLIENT_ID,
        clientSecret: config.GITHUB_CLIENT_SECRET,
        callbackURL: config.GITHUB_CALLBACK_URL,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = profile._json.name;
            if (user) {
                return done(null, user);
            }
        } catch (error) {
            return done(null, false, {
                statusCode: 500,
                message: 'Error de registro en la autenticación por GitHub - gitHub.passport.js: ' + error.message
            });
        };
    }));
};

export const createBDUserGH = async (req, res, user) => {
    let response = {};
    try {
        const existSessionControl = await sessionController.getUserByEmailOrNameOrIdController(req, res, user);
        if (existSessionControl.statusCode === 500) {
            response.statusCode = 500;
            response.message = existSessionControl.message;
            return response;
        }
        if (existSessionControl.statusCode === 200) {
            response.statusCode = 200;
            response.result = existSessionControl.result;
            return response;
        }
        else if (existSessionControl.statusCode === 404) {
            const resultCartControl = await cartController.createCartController(req, res);
            if (resultCartControl.statusCode === 500) {
                response.statusCode = 500;
                response.message = resultCartControl.message;
                return response;
            }
            if (resultCartControl.statusCode === 200) {
                const cart = resultCartControl.result;
                const newUser = {
                    first_name: user,
                    last_name: "X",
                    email: "X",
                    age: 0,
                    password: "Sin contraseña.",
                    role: "user",
                    cart: cart._id,
                };
                const createSessionControl = await sessionController.createUserControler(req, res, newUser);
                if (createSessionControl.statusCode === 500) {
                    response.statusCode = 500;
                    response.message = createSessionControl.message;
                    return response;
                }
                if (createSessionControl.statusCode === 200) {
                    response.statusCode = 200;
                    response.result = createSessionControl.result;
                    return response;
                }
            }
        };
    } catch (error) {
        response.statusCode = 500;
        response.message = 'Error de registro en createBDuserGH - github.passport.js: ' + error.message;
        req.logger.error(response.message);
        return response;
    };
}