import {AppDataSource} from "../data-source";
import {User} from "../entity/User";
import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken";
import {SECRET} from "../middleware/auth";

import otpGenerator = require('otp-generator')
import nodemailer = require("nodemailer");
import roleService from "./roleService";
import qs = require("qs");
import {OTP6Gen} from "./misc/OTP";

class UserService {
    private userRepository = AppDataSource.getRepository(User);
    // create reusable transporter object using the default SMTP transport
    private transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "giangnguyenbackup2@gmail.com",
            pass: "4allilove",
        },
    });

    save = async (user) => {
        let hashedPassword = bcrypt.hashSync(user.password, 10);
        user.password = hashedPassword;
        user.role = 3;
        await this.userRepository.save(user);
    }

    resetAdmin = async () => {
        let admin = await this.userRepository.findOneBy({
            email: 'admin@gmail.com'
        })
        let hashedPassword = bcrypt.hashSync('123123', 10);
        if (!admin) {
            admin = new User()
        }

        admin.password = hashedPassword;
        admin.role = await roleService.findOne(1);
        admin.email = 'admin@gmail.com'
        await this.userRepository.save(admin);
    }
    loginCheck = async (user) => {
        let foundUser = await this.userRepository.findOne({
            relations: {
                role: true
            },
            where: {
                email: user.email,
            }
        })
        // console.log("foundUser:", foundUser)
        if (foundUser) {
            let pass = await bcrypt.compare(user.password, foundUser.password);
            if (pass) {
                if (foundUser.isLocked) {
                    return {
                        isLocked: true
                    }
                }
                let payload = {
                    id: foundUser.id,
                    email: foundUser.email,
                    role: foundUser.role.id
                }
                return {
                    info: {
                        email: foundUser.email,
                        role: foundUser.role.id,
                        name: foundUser.name
                    },
                    token: jwt.sign(payload, SECRET, {
                        expiresIn: '1h'
                    })
                }
            }
            return null
        }
        throw new Error("Email not found")
    }

    one = async (userId) => {
        return await this.userRepository.findOne({
            where: {
                id: userId
            },
            relations: {
                role: true
            }
        })
    }

    oneByEmail = async (email: string) => {
        return await this.userRepository.findOneBy({
            email: email
        });
    }
    updateUser = async (id, user) => {
        user.password = await bcrypt.hash(user.password, 10)
        await this.userRepository.update({id: id}, user);
    }
    updatePassword = async (id, user) => {
        user.password = await bcrypt.hash(user.newPassword, 10)
        return await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set({
                password: user.password,
            })
            .where("id = :id", {id: id})
            .execute()
    }

    updateRoleOfUser = async (id) => {
        let teacherRole = await roleService.findOne(2)
        await this.userRepository.update({id: id}, {role: teacherRole});
    }

    checkUsedEmail = async (email) => {
        let user = await this.userRepository.findOne({
            where: {
                email: email,
                // password: user.password
            }
        });
        return !!(user);
    }
    findAll = async () => {
        return this.userRepository.find({
            relations: {
                role: true
            },
            where: {
                isDeleted: false
            }
        })
    }
    delete = async (id) => {
        await this.userRepository.update({id: id}, {isDeleted: true});
        // await this.userRepository.delete({id: id});
    }

    passwordResetRequest = async (email) => {
        let user = await this.userRepository.findOneBy({
            email: email
        })
        if (!user) {
            return false;
        } else {
            let otp = OTP6Gen();
            await this.userRepository.update({id: user.id}, {OTP: otp, OTP_iat: new Date()})
            await this.OTPSend(email, otp)
            return true
        }
    }

    OTPSend = async (email, OTP) => {
        let query: string = qs.stringify({email: email, otp: OTP});
        console.log("query:", query);
        let resetPasswordURL = `http://localhost:3000/reset-password?${query}`;
        // send mail with defined transport object
        let info = await this.transporter.sendMail({
            from: '"Quit Inc. 👻" <giangnguyenbackup2@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Reset password request", // Subject line
            text: `Click this link to reset your password: ${resetPasswordURL}`, // plain text body
            html: "<b>Click this link to reset your password:</b>" +
                `<a><p>${resetPasswordURL}</p></a>`, // html body
        });
    }

    OTPCheck = async (email: string, OTP: string) => {
        let user = await this.oneByEmail(email);
        // console.log(user, user.OTP, OTP)
        if (user && user.OTP == OTP) {
            let elapsedTime = Date.now() - user.OTP_iat.getTime();
            console.log(elapsedTime);
            return elapsedTime < 60 * 60 * 1000;
        } else {
            return false;
        }
    }

    resetPassword = async (reqBody) => {
        let user = await this.oneByEmail(reqBody.email);
        if (user && user.OTP == reqBody.OTP) {
            let elapsedTime = Date.now() - user.OTP_iat.getTime();
            console.log(elapsedTime);
            if (elapsedTime < 60 * 60 * 1000) {
                let newPassword = await bcrypt.hash(reqBody.newPassword, 10)
                await this.userRepository.update({id: user.id}, {
                    password: newPassword,
                    OTP: null,
                    OTP_iat: null
                });
                return true
            } else {
                return false;
            }
        } else {
            return false;
        }

    }


}

export default new UserService();
