if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const city = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            // bob user id
            author: '601073eb9efdb23df8c3e4f7',
            location: `${cities[city].city}, ${cities[city].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[city].longitude,
                    cities[city].latitude,
                ]
            },
            images: [
                {
                  url: 'https://res.cloudinary.com/dwphntwhr/image/upload/v1610642217/YelpCamp/a9xarpwmdjavyzejhc9c.jpg',
                  filename: 'YelpCamp/a9xarpwmdjavyzejhc9c'
                },
                {
                  url: 'https://res.cloudinary.com/dwphntwhr/image/upload/v1610642221/YelpCamp/wrt3cuvaaestlvla7emq.jpg',
                  filename: 'YelpCamp/wrt3cuvaaestlvla7emq'
                }
              ],
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Velit quo, minima, blanditiis expedita, consequatur nihil impedit iusto dolorem officiis dolorum fugit consequuntur a quaerat inventore esse reiciendis iste veniam doloremque?',
            price,
            freeParking: Math.random() < 0.5,
            freeInternet: Math.random() < 0.5,
            lockersStorage: Math.random() < 0.5,
            childrenActivities: Math.random() < 0.5,
            outdoorEquipment: Math.random() < 0.5,
            petsAllowed: Math.random() < 0.5,
            laundry: Math.random() < 0.5,
            Pool: Math.random() < 0.5,
            tennisCourt: Math.random() < 0.5,
            barLounge: Math.random() < 0.5,
            canoeing: Math.random() < 0.5
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})