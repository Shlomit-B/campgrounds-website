const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': `{{#label}} must not include HTML!`
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required().escapeHTML(),
        price: Joi.number().required().min(0),
        description: Joi.string().required().escapeHTML(),
        location: Joi.string().required().escapeHTML(),
        freeParking: Joi.boolean().invalid(false),
        freeInternet: Joi.boolean().invalid(false),

        lockersStorage: Joi.boolean().invalid(false),
        childrenActivities: Joi.boolean().invalid(false),
        outdoorEquipment: Joi.boolean().invalid(false),
        petsAllowed: Joi.boolean().invalid(false),
        laundry: Joi.boolean().invalid(false),
        Pool: Joi.boolean().invalid(false),
        tennisCourt: Joi.boolean().invalid(false),
        barLounge: Joi.boolean().invalid(false),
        canoeing: Joi.boolean().invalid(false)
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object ({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required().escapeHTML(),
    }).required()
});