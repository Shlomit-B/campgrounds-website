const Campground = require('../models/campground');
const { cloudinary } = require("../cloudinary");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxTokem = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxTokem });

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    const { sort } = req.body;
    var sortBy;
    if (sort && !sort.localeCompare("price")) {
        campgrounds.sort((camp1, camp2) => camp1.price - camp2.price);
        sortBy = "price";
    }
    else {
        campgrounds.sort(compareByTitle);
        sortBy = "title";
    }
    // console.log("campgrounds.length = ", campgrounds.length);
    res.render('campgrounds/index', { campgrounds, sortBy });
};

function compareByTitle(camp1, camp2) {
    if (camp1.title < camp2.title) {
        return -1;
    }
    if (camp1.title > camp2.title) {
        return 1;
    }
    return 0;
}


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


module.exports.renderSearchForm = async (req, res) => {
    const campgrounds = await Campground.find({});
    campgrounds.sort(compareByTitle);

    res.render('campgrounds/search', { campgrounds });
};


module.exports.searchCampgroundByName = async (req, res, next) => {
    const { title } = req.query;

    // Camground name was not entered
    if (!title) {
        req.flash('error', 'Campground was not found');
        return res.redirect('/campgrounds/search');
    }

    const campground = await Campground.findOne({ "title": { $regex: new RegExp(title, "i") } }).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');

    // Campground was not found
    if (!campground || campground.title != title) {
        req.flash('error', 'Campground was not found');
        return res.redirect('/campgrounds/search');
    }

    var averageReview = 0;
    for (let review of campground.reviews) {
        averageReview += review.rating;
    }
    averageReview = averageReview / campground.reviews.length;

    res.render('campgrounds/show', { campground, averageReview });
}


module.exports.searchCampgroundByProperties = async (req, res, next) => {
    var { price, camp } = req.query;

    const freeParking = camp.freeParking || [true, false];
    const freeInternet = camp.freeInternet || [true, false];
    const lockersStorage = camp.lockersStorage || [true, false];
    const childrenActivities = camp.childrenActivities || [true, false];
    const outdoorEquipment = camp.outdoorEquipment || [true, false];
    const petsAllowed = camp.petsAllowed || [true, false];
    const laundry = camp.laundry || [true, false];
    const Pool = camp.Pool || [true, false];
    const tennisCourt = camp.tennisCourt || [true, false];
    const barLounge = camp.barLounge || [true, false];
    const canoeing = camp.canoeing || [true, false];

    if (price) {
        var campgrounds = await Campground.find({
            price: { $lte: price }, freeParking, freeInternet, lockersStorage, childrenActivities,
            outdoorEquipment, petsAllowed, laundry, Pool, tennisCourt, barLounge, canoeing
        });
        var sortBy = "price";
    }
    else {
        var campgrounds = await Campground.find({
            freeParking, freeInternet, lockersStorage, childrenActivities,
            outdoorEquipment, petsAllowed, laundry, Pool, tennisCourt, barLounge, canoeing
        });
        var sortBy = "title";
    }

    res.render('campgrounds/searchResults', { campgrounds, sortBy, price, camp});

    // const amenities = ['freeParking', 'freeInternet'];
    // Object.keys(camp).forEach(key => camp[key] === undefined ? {} : camp[key] = { $or: true, false });
    // console.log("Object.keys(camp) = ", Object.keys(camp));
    // Object.keys(camp).forEach(key => camp[key] === undefined && delete camp[key]);
    // const campgrounds = await Campground.find({ price: { $lte: camp.max_price }, freeParking: camp.freeParking, freeInternet: camp.freeInternet });
    // const campgrounds = await Campground.find({ price: { $lte: camp.max_price } });
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
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
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