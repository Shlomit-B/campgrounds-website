const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')

const imageSchema = new Schema ({
    url: String,
    filename: String
});

imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});


const opts = { toJSON: { virtuals: true } };
const campgroundSchema = new Schema({
    title: String,
    images: [imageSchema],
    price: Number,
    description: String,
    geometry: {
        type: {
          type: String,
          enum: ['Point'],
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
    },
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
        type: Schema.Types.ObjectId,
        ref: 'Review'
        }
    ],
    // Property amenities:
    freeParking: {
        type: Boolean,
        default: false
    },
    freeInternet: {
        type: Boolean,
        default: false
    },
    lockersStorage: {
        type: Boolean,
        default: false
    },
    childrenActivities: {
        type: Boolean,
        default: false
    },
    outdoorEquipment: {
        type: Boolean,
        default: false
    },
    petsAllowed: {
        type: Boolean,
        default: false
    },
    laundry: {
        type: Boolean,
        default: false
    },
    Pool: {
        type: Boolean,
        default: false
    },
    tennisCourt: {
        type: Boolean,
        default: false
    },
    barLounge: {
        type: Boolean,
        default: false
    },
    canoeing: {
        type: Boolean,
        default: false
    }
}, opts);

campgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
    <p>${this.description.substring(0, 30)}...</p>`;
});

campgroundSchema.post('findOneAndDelete', async function(campground) {
    if (campground.reviews.length) {
        const res = await Review.deleteMany({
            _id: {
                $in: campground.reviews
            }
        });
    }
});

module.exports = mongoose.model('Campground', campgroundSchema);