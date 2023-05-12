import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router()
const prisma = new PrismaClient();

// Create Tweet
router.post('/', async (req, res) => {
    const { content, image, userId } = req.body;

    try {
        const result = await prisma.tweet.create({
            data: {
                content,
                image,
                userId //To manage based on auth user
            },
        });

        res.json(result);
    } catch (e) {
        res.status(400).json({ error: "Tweet failed" })
    }
});

//List Tweets
router.get("/", async (req, res) => {
    const allTweets = await prisma.tweet.findMany({ include: { user: { select: { id: true, name: true, username: true, image: true } } } });
    res.json(allTweets)
});

//Get One Tweet
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const tweet = await prisma.tweet.findUnique({ where: { id: Number(id) }, include: { user: true } })

    if (!tweet) {
        return res.status(404).json({ error: "Tweet not found!" })
    }
    res.json(tweet);
});

//Update Tweet
router.put("/:id", (req, res) => {
    const { id } = req.params;
    res.status(501).json({ error: `Not Implemented: ${id}` })
});

//Delete Tweet
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.tweet.delete({ where: { id: Number(id) } });
        res.status(200).json({ error: `Tweet deleted` })
    } catch (e) {
        return res.status(400).json({ error: "Tweet delete failed!" })
    }
})


export default router;