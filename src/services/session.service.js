import SessionDAO from "../DAO/mongodb/SessionMongo.dao.js";
import Mail from '../email/nodemailer.js'
import jwt from 'jsonwebtoken';
import { createHash, isValidPassword } from "../utils.js";
import config from "../config.js";

export default class SessionService {
    constructor() {
        this.sessionDAO = new SessionDAO();
        this.mail = new Mail()
    }
    // Métodos UserService:
    async createUserService(info) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.createUser(info);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Usuario registrado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al registrar al usuario - Service: " + error.message;
        };
        return response;
    };

    async getUserByEmailOrNameOrIdService(identifier) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.getUserByEmailOrNameOrId(identifier);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `No se encontró ningún usuario con el Email, Nombre o ID, ${identifier}.`;
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Usuario obtenido exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al obtener el usuario - Service: " + error.message;
        };
        return response;
    };

    async updateUserProfileSevice(uid, updateUser) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.updateUser(uid, updateUser);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = "Usuario no encontrado.";
            } else if (resultDAO.status === "success") {
                response.statusCode = 200;
                response.message = "Usuario actualizado exitosamente.";
                response.result = resultDAO.result;
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al actualizar los datos del usuario - Service: " + error.message;
        };
        return response;
    };

    async getUserByEmailAndSendEmail(email) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.getUserByEmailOrNameOrId(email);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `No se encontró ninguna cuenta asociada a este correo, ${email}.`;
            } else if (resultDAO.status === "success") {
                const user = resultDAO.result;
                let token = jwt.sign({ email }, config.RESET_PASSWORD_TOKEN, { expiresIn: '1h' })
                let html = `
                <table cellspacing="0" cellpadding="0" width="100%">
                    <tr>
                        <td style="text-align: center;">
                            <img src="https://i.ibb.co/hd9vsgK/Logo-BK-Grande.png" alt="Logo-BK-Grande" border="0" style="max-width: 50% !important; ">
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">
                        <h2 style="font-size: 24px; margin: 0;">Enlace para restablecimiento de contraseña:</h2>
                            <p style="font-size: 16px;">
                            Haga click en el siguiente enlace para restablecer su contraseña:</p>
                            <a href="http://localhost:8080/resetPassword?token=${token}" 
                            style="
                            background-color: #d7eefd;
                            color: #002877; 
                            text-decoration: none;
                            padding: 10px 20px; 
                            border-radius: 1em; 
                            font-size: 16px; 
                            margin: 10px 0; 
                            display: inline-block;"
                            >Restablecer contraseña</a>
                            <p style="font-size: 16px; font-weight: bold;">IMPORTANTE: La validez de este enlace es de 1 hora. Una vez que haya pasado este período, el enlace te llevará automáticamente a la página de "Restablecer Contraseña - Solicitar Correo", donde podrás solicitar uno nuevo.</p>
                            <p style="font-size: 16px;">Gracias, ${user.first_name}.</p>
                            <p style="font-size: 16px;">Para cualquier consulta, no dudes en ponerte en contacto con nuestro equipo de soporte.</p>
                            </td>
                    </tr>
                </table>`;
                const resultSendMail = await this.mail.sendMail(user, "Restablecimiento de contraseña.", html);
                if (resultSendMail.accepted.length > 0) {
                    response.statusCode = 200;
                    response.message = "Correo enviado exitosamente.";
                    response.result = resultSendMail;
                } else {
                    response.statusCode = 500;
                    response.message = "Error al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.";
                };
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al enviar email para restablecer contraseña - Service: " + error.message;
        };
        return response;
    };

    async resetPassUser(userEmail, newPass) {
        let response = {
            userEmail
        };
        try {
            const resultDAO = await this.sessionDAO.getUserByEmailOrNameOrId(userEmail);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `No se encontró ninguna cuenta asociada a este correo, ${userEmail}.`;
            } else if (resultDAO.status === "success") {
                const user = resultDAO.result
                if (isValidPassword(user, newPass)) {
                    response.statusCode = 400;
                    response.message = `La nueva contraseña que has proporcionado es idéntica a tu contraseña actual. Para restablecer la contraseña, por favor introduce una contraseña diferente. Si prefieres mantener tu contraseña actual, puedes iniciar sesión utilizando tus credenciales habituales haciendo clic en "Iniciar sesión".`;
                } else {
                    const password = createHash(newPass);
                    const updateUser = { password };
                    const resultUpdt = await this.sessionDAO.updateUser(user._id, updateUser);
                    if (resultUpdt.status === "error") {
                        response.statusCode = 500;
                        response.message = resultUpdt.message;
                    } else if (resultUpdt.status === "not found user") {
                        response.statusCode = 404;
                        response.message = "Usuario no encontrado.";
                    } else if (resultUpdt.status === "success") {
                        response.statusCode = 200;
                        response.message = "Usuario actualizado exitosamente.";
                        response.result = resultUpdt.result;
                    };
                };
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al restablecer contraseña - Service: " + error.message;
        };
        return response;
    };

    async changeRoleService(uid) {
        let response = {};
        try {
            const resultDAO = await this.sessionDAO.getUserByEmailOrNameOrId(uid);
            if (resultDAO.status === "error") {
                response.statusCode = 500;
                response.message = resultDAO.message;
            } else if (resultDAO.status === "not found user") {
                response.statusCode = 404;
                response.message = `Usuario no encontrado.`;
            } else if (resultDAO.status === "success") {
                let userRole = resultDAO.result.role;
                const newRole = userRole === "user" ? "premium" : "user";
                const updateUser = {
                    role: newRole
                };
                const resultRolPremium = await this.sessionDAO.updateUser(uid, updateUser);
                if (resultRolPremium.status === "error") {
                    response.statusCode = 500;
                    response.message = resultRolPremium.message;
                } else if (resultRolPremium.status === "not found user") {
                    response.statusCode = 404;
                    response.message = "Usuario no encontrado.";
                } else if (resultRolPremium.status === "success") {
                    response.statusCode = 200;
                    response.message = `Usuario actualizado exitosamente, su rol a sido actualizado a ${newRole}.`;
                    const newUser = await this.sessionDAO.getUserByEmailOrNameOrId(uid);
                    let token = jwt.sign({
                        email: newUser.result.email,
                        first_name: newUser.result.first_name,
                        role: newUser.result.role,
                        cart: newUser.result.cart,
                        userID: newUser.result._id
                    }, envCoderSecret, {
                        expiresIn: '7d'
                    });
                    res.cookie(envCoderTokenCookie, token, {
                        httpOnly: true,
                        signed: true,
                        maxAge: 7 * 24 * 60 * 60 * 1000
                    })
                };
            };
        } catch (error) {
            response.statusCode = 500;
            response.message = "Error al modificar el rol del usuario - Service: " + error.message;
        };
        return response;
    };

};