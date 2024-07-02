
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

            const file = req.file;

            if (!file) {
            return res.status(400).json('error: Please  logo is required' );
            }

            const image = file.path;
            const link = await cloudinary.uploader.upload(image);
            let logo = link.secure_url;

            companyData.password = hashedPassword(companyData.password);
            companyData.logo = logo;

            const company = await companyClient.create({
                data: companyData,
                select: {
                    name: true,
                    logo: true,
                    logoBackground: true,
                    website: companyData.website ? true : false,
                    Jobs: companyData.Jobse ? true : false,
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