const Review = require('../models/review');
const Campground = require('../models/campground');

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

module.exports.createReview = async (req, res, next) => {
    const review = new Review(req.body.review);
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');

    // Checks if the user try to comment on his own campground
    if (req.user._id.equals(campground.author._id)) {
        req.flash('error', 'You can not comment on your campground')
        return res.redirect(`/campgrounds/${campground._id}`);
    }

    // Checks if the user comment already on this campground
    for (var i = 0; i < campground.reviews.length; i++) {
        if (req.user._id.equals(campground.reviews[i].author._id)) {
            req.flash('error', 'You can comment only once for each campground!')
            return res.redirect(`/campgrounds/${campground._id}`);
        }
    }
    review.author = req.user._id;
    const date = new Date();
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    review.date = `${month} ${day}, ${year}`;
    campground.reviews.push(review);
    await campground.save();
    await review.save();
    req.flash('success', 'Successfully made a new review!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.editReview = async (req, res) => {
    const { id, reviewId } = req.params;
    const campground = await Campground.findById(id);
    const review = await Review.findByIdAndUpdate(reviewId, {...req.body.review });
    await review.save();
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted reveiw!');
    res.redirect(`/campgrounds/${id}`);
};