import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const EMAIL_TOKEN_EXPIRATION_MINUTES = 10;
const AUTHENTICATION_EXPIRATION_HOURS = 12;
const JWT_SECRET = "SUPER SECRET";

const router = Router();
const prisma = new PrismaClient();

// Generate a random 8 digit number as the email Token
function generateEmailToken(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}
// Generate a random 8 digit number as the email Token
function generateAuthToken(tokenId: number): string {
    const jwtPayload = { tokenId };

    return jwt.sign(jwtPayload, JWT_SECRET, {
        algorithm: "HS256",
        noTimestamp: true
    })
}

// Create a user, if it doesn't exist, generate the email token and send it to their email
router.post("/login", async (req, res) => {
    const { email } = req.body;

    // generate token
    const emailToken = generateEmailToken();
    const expiration = new Date(new Date().getTime() + EMAIL_TOKEN_EXPIRATION_MINUTES * 60000);

    try {
        const createdToken = await prisma.token.create({
            data: {
                type: "EMAIL",
                emailToken,
                expiration,
                user: {
                    connectOrCreate: {
                        where: { email },
                        create: { email },
                    }
                }
            },
        })
        console.log(createdToken);
        // send emailToken to user's email
        res.sendStatus(200);
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: "Authentication failed! Please try again in a bit!" })
    }
})

// Validate the emailToken and Generate a long-lived JWT token 
router.post("/authenticate", async (req, res) => {
    const { email, emailToken } = req.body;

    const dbEmailToken = await prisma.token.findUnique({
        where: {
            emailToken,
        }, include: {
            user: true
        }
    });
    console.log(dbEmailToken);

    if (!dbEmailToken || !dbEmailToken.valid) {
        return res.status(401).json({ message: "Unauthorized request!!!" });
    }

    if (dbEmailToken.expiration < new Date()) {
        return res.status(401).json({ error: "Token Expired!!!" });
    }

    if (dbEmailToken?.user?.email !== email) {
        return res.sendStatus(401);
    }

    // Here we validate that the user is the owner of the email

    // Generate an API token

    const expiration = new Date(new Date().getTime() + AUTHENTICATION_EXPIRATION_HOURS * 3600000);


    const apiToken = await prisma.token.create({
        data: {
            type: "API",
            expiration,
            user: {
                connect: {
                    email,
                },
            },
        },
    });

    // Invalidate the EMAIL token used to generate API token
    await prisma.token.update({
        where: { id: dbEmailToken.id },
        data: { valid: false },
    });

    // Generate the JWT token
    const authToken = generateAuthToken(apiToken.id);

    res.json({ authToken });
})

export default router;