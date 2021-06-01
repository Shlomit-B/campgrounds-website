const Campground = require('../models/campground');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxTokem = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken:  mapBoxTokem });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds});
};

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
      }).send();
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.searchCampground = async(req, res, next) => {
    const { title } = req.body;

    // Camground name was not entered
    if (!title) {
        req.flash('error', 'Campground was not found');
        return res.redirect('/campgrounds');
    }

    const campground = await Campground.findOne({ "title": { $regex : new RegExp(title, "i") } }).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    
    // Campground was not found
    if (!campground || campground.title != title) {
        req.flash('error', 'Campground was not found');
        return res.redirect('/campgrounds');
    }

    var averageReview = 0;
    for (let review of campground.reviews) {
        averageReview += review.rating;
    }
    averageReview = averageReview / campground.reviews.length;

    res.render('campgrounds/show', { campground, averageReview });
};

module.exports.showCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');

    if (!campground) {
        req.flash('error', 'Campground was not found!');
        return res.redirect('/campgrounds');
    }

    var averageReview = 0;
    for (let review of campground.reviews) {
        averageReview += review.rating;
    }
    averageReview = averageReview / campground.reviews.length;
    res.render('campgrounds/show', { campground, averageReview });
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Campground was not found!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
};

module.exports.updateCampgroud = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }
    await campground.save();
    req.flash('success', 'Successfully update campground!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground!');
    res.redirect('/campgrounds');
};