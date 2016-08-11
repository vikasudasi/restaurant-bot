'use strict'

var Config = require('../config')
var FB = require('../connectors/facebook')
var Wit = require('node-wit').Wit
var request = require('request')


var firstEntityValue = function (entities, entity) {
	var val = entities && entities[entity] &&
	Array.isArray(entities[entity]) &&
	entities[entity].length > 0 &&
	entities[entity][0].value

	if (!val) {
		return null
	}
	return typeof val === 'object' ? val.value : val
}


var actions = {
	say (sessionId, context, message, cb) {
		// Bot testing mode, run cb() and return
		if (require.main === module) {
			cb()
			return
		}

		console.log('WIT WANTS TO TALK TO:', context._fbid_)
		console.log('WIT HAS SOMETHING TO SAY:', message)
		console.log('WIT HAS A CONTEXT:', context)

		if (checkURL(message)) {
			FB.newMessage(context._fbid_, message, true)
		} else {
			FB.newMessage(context._fbid_, message)
		}

		
		cb()
		
	},

	merge(sessionId, context, entities, message, cb) {
		// Reset the weather story
		delete context.forecast


		// Retrive the location entity and store it in the context field
		var menu_type = firstEntityValue(entities, 'menu_type')
		if (menu_type) {
			context.menu_type = menu_type
		}

		var food_item = firstEntityValue(entities, 'food_item')
		if (food_item) {
			context.food_item = food_item
		}



		
		cb(context)
	},

	error(sessionId, context, error) {
		console.log(error.message)
	},

	

	['getGreetings'](sessionId, context, cb) {
		context.greeting_response = 'I am fine, Would you like to order some food?'
		cb(context)
	},


	// list of functions Wit.ai can execute
	['getMenu'](sessionId, context, cb, entities) {

		context.menuitems = 'Chinese, Japanese, Indian, Spanish, American'

		cb(context)
	},

	// list of functions Wit.ai can execute
	['getSubMenu'](sessionId, context, cb) {
		
		console.log("context: "+JSON.stringify(context));
		
		if (context['menu_type']) {
		
			context.submenu_items = getMenu(context.menu_type)
			
		}
		cb(context)
	},

	['addItemsToCart'](sessionId, context, cb) {
		
		if (context.food_item) {
			if(context.food_items_cart){
				//context.food_items_cart[context.food_items_cart.length-1] = context.food_item;	
				context.food_items_cart = ','+ context.food_item	
			}else{
				//context.food_items_cart = {}
				context.food_items_cart = context.food_item	
			}
		}
		cb(context)
	},

	

	['getOrderSummery'](sessionId, context, cb) {
		
		if (context.food_items_cart) {
				context.order_summary=context.food_items_cart			
		}
		cb(context)
	},

	['confirmOrder'](sessionId, context,cb) {
		
			context.total_amount='500'			
			cb(context)
	},

	['distroySession'](sessionId, context, cb){
		context = {};
		
	},
	['fetch-pics'](sessionId, context, cb) {
		var wantedPics = allPics[context.cat || 'default']
		context.pics = wantedPics[Math.floor(Math.random() * wantedPics.length)]

		cb(context)
	}
}

// SETUP THE WIT.AI SERVICE
var getWit = function () {
	console.log('GRABBING WIT')
	return new Wit(Config.WIT_TOKEN, actions)
}

module.exports = {
	getWit: getWit,
}

// BOT TESTING MODE
if (require.main === module) {
	console.log('Bot testing mode!')
	var client = getWit()
	client.interactive()
}

// GET WEATHER FROM API
var getWeather = function (location) {
	return new Promise(function (resolve, reject) {
		var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22'+ location +'%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys'
		request(url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var jsonData = JSON.parse(body)
				var forecast = jsonData.query.results.channel.item.forecast[0].text
				console.log('WEATHER API SAYS....', jsonData.query.results.channel.item.forecast[0].text)
				return forecast
			}
		})
	})
}

var getMenu = function(Type){
	if(Type.toLowerCase() === 'Chinese'.toLowerCase()){
		return 'Chow mein,Dim sum,Jiaozi, Ramen, Lo mein';
	}if(Type.toLowerCase() === 'Japanese'.toLowerCase()){
		return 'Sushi, Tempura, Sukiyaki, Ramen, Curry rice, Tonkatsu';
	}if(Type.toLowerCase() === 'Indian'.toLowerCase()){
		return 'Amritsari fish, Baati, Amritsari kulcha, Biryani, Butter chicken';
	}if(Type.toLowerCase() === 'Spanish'.toLowerCase()){
		return 'Escabeche, Gachas, Merienda, Paella';
	}if(Type.toLowerCase() === 'American'.toLowerCase()){
		return 'Bread, Barbecue, Blue Cheese Dressing, Brunswick Stew, Buffalo Burger, Buffalo Wing, Burnt Ends, Chicken And Waffles';
	}
	return '';
}
// CHECK IF URL IS AN IMAGE FILE
var checkURL = function (url) {
	return(url.match(/\.(jpeg|jpg|gif|png)$/) != null);
}

// LIST OF ALL PICS
var allPics = {
	corgis: [
	'http://i.imgur.com/uYyICl0.jpeg',
	'http://i.imgur.com/useIJl6.jpeg',
	'http://i.imgur.com/LD242xr.jpeg',
	'http://i.imgur.com/Q7vn2vS.jpeg',
	'http://i.imgur.com/ZTmF9jm.jpeg',
	'http://i.imgur.com/jJlWH6x.jpeg',
	'http://i.imgur.com/ZYUakqg.jpeg',
	'http://i.imgur.com/RxoU9o9.jpeg',
	],
	racoons: [
	'http://i.imgur.com/zCC3npm.jpeg',
	'http://i.imgur.com/OvxavBY.jpeg',
	'http://i.imgur.com/Z6oAGRu.jpeg',
	'http://i.imgur.com/uAlg8Hl.jpeg',
	'http://i.imgur.com/q0O0xYm.jpeg',
	'http://i.imgur.com/BrhxR5a.jpeg',
	'http://i.imgur.com/05hlAWU.jpeg',
	'http://i.imgur.com/HAeMnSq.jpeg',
	],
	default: [
	'http://blog.uprinting.com/wp-content/uploads/2011/09/Cute-Baby-Pictures-29.jpg',
	],
};
