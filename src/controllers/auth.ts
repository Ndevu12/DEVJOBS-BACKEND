import { RequestHandler } from "express";
import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from "@prisma/client";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { comparePassword, hashedPassword } from "../helpers/password";
import { generateToken, verifyToken } from "../helpers/token";
import path from "path";
import cloudinary from '../utils/claudinary';

const userClient = new PrismaClient().user;
const companyClient = new PrismaClient().company;

console.log('Inside Prisma client in auth.ts');
export class User {
    postUser: RequestHandler = async (req, res) => {
        console.log('Inside postUser in auth.ts');
        try {
            const userData = req.body;

            if (userData.id) delete userData.id;

            const existingUser = await userClient.findFirst({
                where: {
                    email: userData.email
                }
            });

            if (existingUser) {
                return res.status(409)
                    .json({
                        message: 'User already exist'
                    })
            }

            if (
                !userData.name 
                || !userData.email 
                || !userData.password 
                || !userData.occupation 
                ) {
                return res.status(400)
                   .json({
                        message: 'Missing required fields'
                    })
            }

            userData.password = await hashedPassword(userData.password);

            const user = await userClient.create({
                data: userData,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    occupation: true,
                    AppliedJobs: true
                }
            });

            res.status(200).json({Message: 'User registered successfully', user: user });
        } catch (error) {
            console.log('Inside catch block in postUser in auth.ts', error);
            if ((error as Error).name === 'PrismaClientKnownRequestError') {
                res.status(409)
                    .json({
                        message: 'User already exist'
                    })
            }
            else if ((error as Error).name === 'PrismaClientValidationError') {
                res.status(422)
                    .json({
                        message: 'Validation Error'
                    })
            } else {
                res.status(500)
                    .json({
                        status: 'Server Error.',
                        error: error
                    })
            }
        }
    }
    postLoginUser: RequestHandler = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Bad Request: email or password is required' });
            }

            const user = await userClient.findUnique({
                where: {
                    email: email
                }
            });

            if (user) {
                const match = await comparePassword(password, user.password);
                if (match) {
                    const token = generateToken({ userId: user.id, email: user.email, });
                    return res
                        .status(200)
                        .json({Message: 'Logged in successfully', token})
                }
            }
            res.status(401).json({ message: 'Authentication Failed' })
        } catch (error) {
            console.log(error);
            if ((error as Error).name === 'PrismaClientValidationError') {
                res.status(422)
                    .json({
                        message: 'Validation Error'
                    })
            } else {
                console.log(error);
                res.status(500)
                    .json({
                        status: 'Server Error.',
                        error: error
                    })
            }
        }
    }
}

export class Company {
    postCompany: RequestHandler = async (req, res) => {
        try {
            const companyData = { ...req.body };

            if (!companyData.name 
                || !companyData.email 
                || !companyData.password 
                ) {
                return res.status(400)
                   .json({
                        message: 'Missing required fields'
                    })
            }

            if (companyData.id) {
                delete companyData.id;
            }

            // Access the files from req.files
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            // Check if the required files are present
            const logoFile = files.logo ? files.logo[0] : null;
            const logoBackgroundFile = files.logoBackground ? files.logoBackground[0] : null;

            if (!logoFile || !logoBackgroundFile) {
                return res.status(400).json({
                    message: 'Both logo and logoBackground are required'
                });
            }

            // Upload the files to Cloudinary
            const logoUpload = await cloudinary.uploader.upload(logoFile.path);
            const logoBackgroundUpload = await cloudinary.uploader.upload(logoBackgroundFile.path);

            const logo = logoUpload.secure_url;
            const logoBackground = logoBackgroundUpload.secure_url;

            companyData.password = await hashedPassword(companyData.password);
            companyData.logo = logo;
            companyData.logoBackground = logoBackground;

            const company = await companyClient.create({
                data: companyData,
                select: {
                    name: true,
                    logo: true,
                    logoBackground: true,
                    website: companyData.website ? true : false,
                    Jobs: companyData.Jobs ? true : false,
                }
            });

            res.status(200).json({ company })
        } catch (error) {
            console.log('Inside company controller error: ', error)
            if ((error as Error).name === 'PrismaClientKnownRequestError') {
                res.status(409)
                    .json({
                        message: 'User already exist'
                    })
            }
            else if ((error as Error).name === 'PrismaClientValidationError') {
                res.status(422)
                    .json({
                        message: 'Validation Error'
                    })
            } else {
                res.status(500)
                    .json({
                        status: 'Server Error.',
                        error: error
                    })
            }
        }
    }

    postLoginCompany: RequestHandler = async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Bad Request: email or password is required' });
            }

            const company = await companyClient.findUnique({
                where: {
                    email: email
                }
            });

            if (company) {
                const match = await bcrypt.compare(password, company.password);
                if (match) {
                    return res
                        .status(200)
                        .json({
                            token: jwt.sign(
                                {
                                    companyId: company.id,
                                    email: company.email,
                                },
                                `${process.env.JWT_SECRET}`,
                                { expiresIn: '1h' }
                            ),
                            refreshToken: jwt.sign(
                                {
                                    companyId: company.id,
                                    email: company.email,
                                },
                                `${process.env.JWT_REFRESH_SECRET}`
                            )
                        })
                }
            }
            res.status(401).json({ message: 'Authentication Failed' })
        } catch (error) {
            if ((error as Error).name === 'PrismaClientValidationError') {
                res.status(422)
                    .json({
                        message: 'Validation Error'
                    })
            } else {
                res.status(500)
                    .json({
                        status: 'Server Error.',
                        error: error
                    })
            }
        }
    }

    accessToken: RequestHandler = async (req, res) => {
        try {
            const refreshToken = req.body.token;

            const decodedToken = await verifyToken(refreshToken) as JwtPayload;

            let account;

            if (decodedToken.companyId) {
                account = await companyClient.findUnique({
                    where: {
                        id: decodedToken.companyId
                    }
                });

                if (account) {
                    const token = await generateToken({ companyId: account.id, email: account.email });
                    return res
                        .status(200)
                        .json({Message: 'Access toke generated successfully', token
                        })
                }
            }
            else if (decodedToken.userId) {
                
                account = await userClient.findUnique({
                    where: {
                        id: decodedToken.userId
                    }
                })
                if (account) {
                    const token = await generateToken({ userId: account.id, email: account.email });
                    return res
                        .status(200)
                        .json({message: 'Access toke generated successfully',
                            token
                        })
                }
            }

            res.status(401).json('Unauthorized, Log in first');

        } catch (error) {

            if ((error as Error).name === 'PrismaClientKnownRequestError') {
                return res.status(404).json({ message: 'Make sure the submitted token is valid' });
            }
            else if ((error as Error).name === 'PrismaClientValidationError') {
                res.status(422)
                    .json({
                        message: 'Validation Error'
                    })
            } else if ((error as Error).name === 'JsonWebTokenError') {
                res.status(401)
                    .json({
                        message: 'invalid token'
                    })
            }
            else {
                return res.status(500)
                    .json({
                        status: 'Server Error.',
                        error: error
                    })
            }
        }
    }
}