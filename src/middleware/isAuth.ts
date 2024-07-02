import { RequestHandler, Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import 'dotenv/config'

import { Prisma, PrismaClient } from "@prisma/client";

const userClient = new PrismaClient().user;
const companyClient = new PrismaClient().company;

// Extend Request interface to include the userId property
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            companyId?: string;
        }
    }
}


export const isAuth: RequestHandler = async (req, res, next) => {
    try {
        const header = req.get('Authorization');

        if (!header) {
            return res.status(401).json({ message: "You're not authorized." })
        }

        const token = header.split(' ')[1];
        const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload;

        if (!decodedToken) {
            return res.status(401).json({ message: "You're not authorized." })
        }

        if (decodedToken.userId) {
            req.userId = decodedToken.userId;
            const user = await userClient.findUnique({
                where: {
                    id: decodedToken.userId
                }
            });
            if (!user) {
                return res.status(404)
                    .json({
                        message: "User not found"
                    });
            }
        }

        else if (decodedToken.companyId) {
            req.companyId = decodedToken.companyId;
            const user = await companyClient.findUnique({
                where: {
                    id: decodedToken.companyId
                }
            });
            if (!user) {
                return res.status(404)
                    .json({
                        message: "User not found"
                    });
            }
        }

        else {
            return res.status(401)
                .json({
                    message: "You're not authorized."
                });
        }
        next()
    }
    catch (err) {

        if ((err as Error).name === 'JsonWebTokenError' || (err as Error).name === 'TokenExpiredError') {
            res.status(401).json({ message: 'You\'re not authorized.' });
        } else {
            res.status(500).json({ message: "Server error" });
        }
    }
}

export const isUserAuth: RequestHandler = async (req, res, next) => {
    try {
        const header = req.get('Authorization');

        if (!header) {
            return res.status(401).json({ message: "You're no authorized" })
        }

        const token = header.split(' ')[1];
        const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload;

        if (!decodedToken) {
            return res.status(401).json({ message: "You're no authorized" })
        }
        req.userId = decodedToken.userId;

        const user = await userClient.findUnique({
            where: {
                id: decodedToken.userId
            }
        });
        if (!user) {
            return res.status(404)
                .json({
                    message: "User not found"
                });
        }
        next()
    }
    catch (err) {
        if ((err as Error).name === 'JsonWebTokenError' || (err as Error).name === 'TokenExpiredError') {
            res.status(401).json({ message: 'You\'re not authorized' });
        } else {
            res.status(500).json({ message: "Server error" });
        }
    }
}

export const isCompanyAuth: RequestHandler = async (req, res, next) => {
    try {
        const header = req.get('Authorization');

        if (!header) {
            return res.status(401).json({ message: "You're not authorized" })
        }

        const token = header.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "Invalid token format" });
        }

        const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload;

        if (!decodedToken) {
            return res.status(401).json({ message: "You're not authorized" })
        }

        req.companyId = decodedToken.companyId;

        const company = await companyClient.findUnique({
            where: {
                id: decodedToken.companyId
            }
        });

        if (!company) {
            return res.status(404)
                .json({
                    message: "User not found"
                });
        }
        next()
    }
    catch (err) {

        if ((err as Error).name === 'JsonWebTokenError' || (err as Error).name === 'TokenExpiredError') {
            res.status(401).json({ message: 'You\'re not authorized' });
        }
        else {
            res.status(500).json({ message: "Server error" });
        }
    }
}