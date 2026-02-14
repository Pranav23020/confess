const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Force IPv4 if localhost is used
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
    process.env.MONGODB_URI = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
}

const Confession = require('../models/Confession');

const VALENTINES_CONFESSIONS = [
    // Romantic & Sweet
    { text: "I bought roses for myself this Valentine's Day because I deserve them too.", category: 'love' },
    { text: "I'm spending Valentine's alone but honestly, I'm okay with it. Self-love is real love.", category: 'love' },
    { text: "I still have the first love letter they gave me. I read it when I miss them.", category: 'love' },
    { text: "I've never been in love, and on days like today, it hits different.", category: 'love' },
    { text: "My partner doesn't know I secretly plan our forever together in my head.", category: 'love' },

    // Heartbreak & Longing
    { text: "I'm pretending to be happy today but I'm heartbroken inside.", category: 'love' },
    { text: "Valentine's Day reminds me of someone I can never have.", category: 'love' },
    { text: "I miss my ex more than I should. Especially today.", category: 'love' },
    { text: "I wrote them a love letter but I'll never send it.", category: 'love' },
    { text: "I still wear the bracelet they gave me on our first Valentine's.", category: 'love' },

    // Secret Crushes
    { text: "I have a crush on my best friend and Valentine's Day makes it harder to hide.", category: 'love' },
    { text: "They have no idea I'm in love with them. And I'll never tell.", category: 'love' },
    { text: "I bought them a gift but I'm too scared to give it.", category: 'love' },
    { text: "I've been waiting for them to notice me for 3 years. Still waiting.", category: 'love' },
    { text: "I practice what I'd say if they asked me to be their Valentine.", category: 'love' },

    // Complex Feelings
    { text: "I'm in a relationship but I don't feel the spark anymore.", category: 'love' },
    { text: "I love them but I'm scared of commitment.", category: 'love' },
    { text: "We broke up months ago but I still think about them every day.", category: 'love' },
    { text: "I'm afraid I'll never find someone who truly understands me.", category: 'love' },
    { text: "Love scares me because everyone I've loved has left.", category: 'mental-health' },

    // Self-Love & Growth
    { text: "This Valentine's Day, I'm choosing myself for once.", category: 'life' },
    { text: "I don't need someone to complete me. I'm already whole.", category: 'life' },
    { text: "Single on Valentine's Day and learning to love it.", category: 'life' },
    { text: "My biggest relationship this year is with myself, and it's beautiful.", category: 'life' },
    { text: "I'm healing from my last relationship and it feels like freedom.", category: 'mental-health' },

    // Bittersweet
    { text: "They were my Valentine once. Now they're just a memory.", category: 'love' },
    { text: "I wish things had ended differently between us.", category: 'love' },
    { text: "Sometimes I wonder if they think about me too.", category: 'love' },
    { text: "I deleted all our photos but I can't delete the memories.", category: 'love' },
    { text: "I hope they're happy, even if it's not with me.", category: 'love' },

    // Hope & Future
    { text: "I believe I'll find my person someday, just not today.", category: 'love' },
    { text: "This Valentine's Day might be lonely, but next year could be different.", category: 'life' },
    { text: "I'm manifesting the love I deserve this year.", category: 'life' },
    { text: "To my future Valentine: I'm working on being the best version of myself for us.", category: 'love' },
    { text: "I'm not looking for love, but I'm open if it finds me.", category: 'love' },
];

const generateAnonymousId = () => {
    return crypto.randomBytes(16).toString('hex');
};

const seedValentinesConfessions = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing confessions (optional - comment out if you want to keep old ones)
        // await Confession.deleteMany({});
        // console.log('🗑️  Cleared existing confessions');

        const confessions = VALENTINES_CONFESSIONS.map(({ text, category }) => ({
            text,
            category,
            deviceHash: generateAnonymousId(), // Required field for anonymous users
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            likeCount: Math.floor(Math.random() * 50), // Random likes for variety
            replyCount: Math.floor(Math.random() * 10),
        }));

        await Confession.insertMany(confessions);
        console.log(`✅ Successfully added ${confessions.length} Valentine's Day confessions!`);
        console.log('💜 Your database now has romantic content perfect for a Valentine\'s Day reel!');

    } catch (error) {
        console.error('❌ Error seeding confessions:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

seedValentinesConfessions();
