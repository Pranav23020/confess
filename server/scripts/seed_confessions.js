const mongoose = require('mongoose');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Force IPv4 if localhost is used to avoid Node 17+ IPv6 issues
if (process.env.MONGODB_URI && process.env.MONGODB_URI.includes('localhost')) {
    process.env.MONGODB_URI = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
}



const Confession = require('../models/Confession');

const CATEGORIES = ['love', 'career', 'secrets', 'life', 'relationships', 'mental-health', 'other'];

const SAMPLE_TEXTS = [
    "I wish I had told her how I felt before she moved away.",
    "My job is stressful but I love the money, creating a golden handcuffs situation.",
    "I'm secretly learning to dance so I can surprise my partner at our wedding.",
    "I feel lost sometimes, like everyone else has a manual for life that I missed.",
    "The coffee shop down the street is my happy place, I go there just to smell the beans.",
    "I lied about my age to my friends and now it's too late to correct them.",
    "I want to travel the world but I'm terrified of flying.",
    "I miss my childhood dog more than I miss some of my relatives.",
    "I'm afraid of failure, so I never really try my hardest at anything.",
    "I think I'm in love with my best friend but I don't want to ruin our friendship.",
    "I stole a candy bar when I was 5 and I still feel guilty about it.",
    "I pretend to be busy at work but I'm actually just scrolling Reddit.",
    "I saved a kitten yesterday and didn't tell anyone because I didn't want the attention.",
    "I hate the music my spouse listens to, but I sing along to make them happy.",
    "I'm planning to quit my job and start a bakery next year.",
    "I sometimes wish I could restart my life from age 18.",
    "I learned a new language just to impress a crush who didn't even notice.",
    "I eat ice cream for breakfast on Sundays.",
    "I'm scared of the dark and sleep with a nightlight.",
    "I donated anonymously to a charity and it felt better than getting recognition.",
    "I broke my mom's favorite vase and blamed it on the cat.",
    "I write poetry that I'll never show anyone.",
    "I think aliens are real and they are already here.",
    "I want to learn to play the piano.",
    "I regret not studying harder in college.",
    "I love rainy days because they give me an excuse to stay inside.",
    "I'm actually an introvert pretending to be an extrovert.",
    "I have a secret savings account for a rainy day.",
    "I want to write a book about my life.",
    "I'm jealous of my sibling's success.",
    "I wish I could talk to my younger self.",
    "I'm addicted to collecting vintage stamps.",
    "I never learned how to ride a bike.",
    "I'm afraid of ending up alone.",
    "I love the smell of old books.",
    "I want to live in a cabin in the woods.",
    "I'm secretly a great cook but I never cook for anyone.",
    "I miss the days before social media.",
    "I want to adopt a shelter dog.",
    "I'm thinking of changing my career path completely.",
    "I love watching cartoons on Saturday mornings.",
    "I sometimes pretend to be on the phone to avoid talking to people.",
    "I have a crush on a fictional character.",
    "I want to learn to surf.",
    "I regret saying mean things to my friend.",
    "I'm grateful for my health.",
    "I want to learn to paint.",
    "I'm afraid of spiders.",
    "I love spicy food but it doesn't love me.",
    "I want to go skydiving.",
    "I'm secretly learning magic tricks.",
    "I wish I was taller.",
    "I want to learn to code better."
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomCategory = () => getRandomElement(CATEGORIES);
const getRandomText = () => getRandomElement(SAMPLE_TEXTS);

const generateDeviceHash = () => {
    return crypto.randomBytes(16).toString('hex');
};

const generateConfession = () => {
    return {
        text: getRandomText(),
        category: getRandomCategory(),
        deviceHash: generateDeviceHash(),
        isPublished: true,
        isHidden: false,
        replyCount: Math.floor(Math.random() * 10),
        likeCount: Math.floor(Math.random() * 50),
        reportCount: 0,
        hashtags: [],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        createdAt: new Date()
    };
};

const seedConfessions = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB.');

        const confessions = [];
        for (let i = 0; i < 55; i++) { // Generating 55 confessions
            confessions.push(generateConfession());
        }

        console.log(`Inserting ${confessions.length} confessions...`);
        await Confession.insertMany(confessions);
        console.log('Successfully inserted confessions!');

        mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding confessions:', error);
        process.exit(1);
    }
};

seedConfessions();
