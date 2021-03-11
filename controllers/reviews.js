const Review = require('../models/review');
const Campground = require('../models/campground');

module.exports.createReview = async (req, res, next) => {
    const review = new Review(req.body.review);
    const campground = await Campground.findById(req.params.id);
    review.author = req.user._id;
    campground.reviews.push(review);
    await campground.save();
    await review.save();
    req.flash('success', 'Successfully made a new review!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted reveiw!');
    res.redirect(`/campgrounds/${id}`);
}