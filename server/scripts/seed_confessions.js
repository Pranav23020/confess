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
    "I accidentally called my boss 'mom' during a presentation and I want to crawl into a hole.",
    "I'm secretly in love with my neighbor but we've only ever said hi in the elevator.",
    "I told everyone I quit smoking 2 years ago, but I still have one every stressful Friday night.",
    "I rejected a proposal because the ring was ugly. I feel shallow but I couldn't wear it forever.",
    "I pretend to not know how to fix computers so my family stops asking me for free tech support.",
    "I put my headphones on at work with nothing playing just so people don't talk to me.",
    "I'm 30 and I still sleep with the stuffed animal I got when I was 5.",
    "I caught my best friend's partner cheating but I'm too scared to ruin their happiness by telling them.",
    "I only go to the gym to shower because my water bill is too high.",
    "I told my vegan girlfriend I'm vegan too, but I eat burgers whenever she's out of town.",
    "I still check my ex's social media every single day even though it's been 3 years.",
    "I won the lottery, only $50k, but I haven't told my spouse because I want to pay off my own debt first.",
    "I'm jealous of my cat's life. Sleeping 16 hours a day sounds like heaven.",
    "I lie about being busy on weekends just to stay home and play video games.",
    "I think I'm falling for my therapist.",
    "I stole my roommate's expensive shampoo and replaced it with cheap stuff. They still haven't noticed.",
    "I deleted a rigorous project file just to get an extension on the deadline. I blamed a 'corruption'.",
    "I actually like pineapple on pizza but the internet bullies me into silence.",
    "I haven't washed my favorite jeans in 6 months because I'm afraid they'll shrink.",
    "I suspect my parents love my sibling more than me, so I try to buy their affection with expensive gifts.",
    "I'm moving to a new city without telling anyone. I just need a fresh start.",
    "I use ChatGPT to write all my work emails and nobody has caught on yet.",
    "I found a wallet with $200 and kept the cash. I mailed the wallet back though.",
    "I'm afraid I'll never be as successful as my friends expect me to be.",
    "I told my kids the ice cream truck plays music when it's out of ice cream.",
    "I haven't brushed my teeth since yesterday morning and I'm going on a date tonight.",
    "I secretly donate to streamers who have 0 viewers to make their day.",
    "I hate being a lawyer but the money is the only thing keeping my family afloat.",
    "I'm writing a novel about my workplace and if it gets published, I'm definitely getting fired.",
    "I think my dog understands English and chooses to ignore me.",
    "I never tip at coffee shops if they just hand me a cup. Am I terrible?",
    "I kissed a stranger at a bar and gave them a fake number.",
    "I'm 40 and I still don't know how to do my own taxes.",
    "I told my partner I love their cooking, but I feed it to the dog when they aren't looking.",
    "I swipe right on everyone on dating apps just to boost my ego.",
    "I'm terrified of becoming like my father.",
    "I have a fake Instagram account just to stalk people from high school.",
    "I wear glasses to look smarter, but they are just clear lenses.",
    "I accidentally scratched a parked luxury car and drove away. Guilt eats me alive sometimes.",
    "I want to break up with my partner but we just signed a year lease.",
    "I'm secretly learning how to knit so I can make my grandma a scarf before she passes.",
    "I genuinely believe ghosts are living in my attic.",
    "I hide snacks in the laundry room so my kids don't eat them all.",
    "I'm in debt because I keep buying expensive collectibles I don't need.",
    "I told my boss I was sick to go to a concert. Best night of my life.",
    "I think my friends have a separate group chat without me.",
    "I'm planning to propose this weekend and I'm physically shaking with nerves.",
    "I still watch cartoons from the 90s when I'm sad.",
    "I don't believe in love anymore after my last relationship.",
    "I wish I could tell my parents I'm gay, but I know they'll disown me.",
    "I accidentally sent a screenshot of a chat... to the person I was chatting with.",
    "I'm learning a new language to surprise my partner for our anniversary trip.",
    "I feel like an imposter in my high-paying tech job.",
    "I miss the person I was before the pandemic.",
    "I want to quit everything and become a farmer."
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
