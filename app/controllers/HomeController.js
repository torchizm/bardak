const res = require('express/lib/response');
const sequelize = require('sequelize');
const Item = require('../models/Item');

exports.homePage = async (req, res, next) => {
	if (!req.session.isLoggedIn) {
		res.render('welcome');
	}

	let items = [];
	let itemsObj = [];

	if (req.session.user.permission == 1) {
		itemsObj = await Item.findAll({
			where: {
				buyer: req.session.user.id
			}
		});
	} else {
		itemsObj = await Item.findAll({
			attributes: {
				include: [
					[
						sequelize.literal(`(
							SELECT fullName
							FROM users
							WHERE users.id = items.buyer
						)`),
						'fullName'
					]
				]
			}
		});
	}

	itemsObj.forEach(item => {
		items.push(item.dataValues);
	});

	const page = req.session.user.permission == 1 ? 'home' : 'admin_home';

	console.log(items);
	res.render(page, {
		items: items,
		user: req.session.user.fullName
	});
};

exports.qrCode = (req, res, next) => {
	res.render('qrcode');
}

exports.redirect = async (req, res, next) => {
	console.log(req);
	console.log("ID", req.params.id)

	const i = await Item.findOne({
		where: {
			qrCode: req.params.id
		}
	});

	if (i == null) {
		res.redirect('/welcome');
		return;
	}

	if (isValidHttpUrl(i.dataValues.redirectTo)) {
		res.redirect(i.dataValues.redirectTo);
	} else {
		res.render('showmessage', {
			message: i.dataValues.redirectTo
		});
	}
}

function isValidHttpUrl(string) {
	let url;
	try {
		url = new URL(string);
	} catch (_) {
		return false;  
	}
	return url.protocol === "http:" || url.protocol === "https:";
}