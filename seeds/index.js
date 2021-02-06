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
            // 601c1498394df20015b28f64
            author: '601c1498394df20015b28f64',
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
            price
        })
        await camp.save();
    }
}

seedDB().then(() => {
    mongoose.connection.close();
})