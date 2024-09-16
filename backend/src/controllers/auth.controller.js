import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import speakeasy from "speakeasy";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, "../../users.json");


const writeFile = (user) => {
    const registeredUser = fs.writeFileSync(usersFilePath, JSON.stringify(user, null, 2));
    return registeredUser;
}

const readFile = () => {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
}

export const register = async(req, res) => {

    const { email, password } = req.body;

    try {

        const users = readFile();
        const foundUser = users.find(user => user.email === email);
        
        if(foundUser) return res.status(404).json({
            message: `El usuario const email: '${email}' no existe.`,
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const otpSecret = speakeasy.generateSecret({ length:10 });

        const user = {
            email,
            password: hashedPassword,
            secret: otpSecret.base32,
            optVerified: false,
        };

        users.push(user);
        writeFile(users);

        res.status(201).json({
            message: "Usuario registrado exitosamente.",
            data: user,
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Error al registrar el usuario",
            error: error.message
        });
    }
}

export const login = async(req, res) => {

    const { email , password } = req.body;

    try {

        const users = readFile();

        const foundUser = users.find(user => user.email === email);
        if(!foundUser) return res.status(404).json({
            message: `El usuario const email: '${email}' no existe.`,
        });

        const comparePassword = await bcrypt.compare(password, foundUser.password);
        if(!comparePassword) return res.status(400).json({
            message: "Credeniales incorrectas.",
        });

        // genera el codigo
        const otpCode = speakeasy.totp({
            secret: foundUser.secret,
            encoding: "base32",
        });

        const transporter = nodemailer.createTransport({
            service: "outlook",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD, 
            }
        });

        const emailBody = {
            from: process.env.EMAIL,
            to: email,
            subject: "Codigo de confirmacion",
            text: `Tu codigo de verificacion es: ${otpCode}`,
        };

        transporter.sendMail(emailBody, (error, info) => {

            if(error) return res.status(400).json({
                message: "Error del envio del codigo de confirmacion.",
                error: error.message,
            });

            res.status(200).json({
                message: "Verificar su codigo de ingreso en el coreeo.",
            });
        });

        
    } catch (error) {
        res.status(500).json({
            message: `Error al iniciar sesion con el emial '${email}'`,
            error: error
        });
    }
}

export const verifyOTP = async(req, res) => {

    const { otpCode, email } = req.body;

    try {

        const users = readFile();

        const foundUser = users.find(user => user.email === email);
        if(!foundUser) return res.status(404).json({
            message: `El usuario const email: '${email}' no existe.`,
        });;

        const isVerified = speakeasy.totp.verify({
            secret: foundUser.secret,
            encoding: "base32",
            token: otpCode,
            window: 1000,
        });

        if (isVerified) {

            foundUser.optVerified = true;
            writeFile(users);

            jwt.sign(

                { email: foundUser.email },
                process.env.JWT_SECRET_KEY,
                { expiresIn: "1h" },
                (err, token) => {

                    if(err) return res.status(400).json({
                        message: "Error al generar el token.",
                        error: err.message,
                    });

                    return res.status(200).json({
                        message: "Ingreso exitoso",
                        token
                    });
                }
            );

        } else {
            res.status(400).json({
                message: "error al verificar el otp",
            });
        }
        
    } catch (error) {
        res.status(500).json({
            message: "Error al verificar el OTP.",
            error: error.message
        });
    }
}
