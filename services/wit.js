'use strict'

var Config = require('../config')
var FB = require('../connectors/facebook')
var Wit = require('node-wit').Wit
var request = require('request')


var firstEntityValue = function (entities, entity) {
	console.log("entities for entity"+entity+":  "+JSON.stringify(entities[entity]))
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

		if (message.includes("image_url")) {
			console.log("checkURL true"+JSON.stringify(message));
			FB.newMessage(context._fbid_, context.menuitems, true)
		} else {

			console.log("checkURL false"+JSON.stringify(message));
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
			console.log("new food item"+ context.food_item);
		}

		var yes_no = firstEntityValue(entities, 'yes_no')
		if(yes_no){
			context.yes_no = yes_no
		}
		
		cb(context)
	},

	error(sessionId, context, error) {
		console.log(error.message)
	},

	

	['getGreetings'](sessionId, context, cb) {
		context.greeting_response = 'Hey :), Would you like to order some food?'
		cb(context)
	},


	// list of functions Wit.ai can execute
	['getMenu'](sessionId, context, cb, entities) {
		
			//context.menuitems = 'Chinese, Japanese, Indian, Spanish, American'
			context.menuitems=menu_format;
		
		
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
		var item ={item:context.food_item}
		
		console.log("new item to add"+JSON.stringify(item));
		if (context.food_item) {
			
			if(context.food_items_cart){
				context.food_items_cart[context.food_item] = item;	
			}else{
				context.food_items_cart ={}
				context.food_items_cart[context.food_item] = item;	
			}
		}
		cb(context)
	},
	['removeItemFromCart'](sessionId, context, cb) {
		
		if (context.remove_item) {
			if(context.food_items_cart[context.remove_item]){
				delete context.food_items_cart[context.remove_item]
					
			}
		}
		cb(context)
	},
	['removeCart'](sessionId, context, cb) {
		
		if (context.food_items_cart) {
			if(context.food_items_cart[context.remove_item]){
				delete context[food_items_cart]
					
			}
		}
		cb(context)
	},

	

	['getOrderSummary'](sessionId, context, cb) {
		
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
		context = {}
	},

	['fetch-pics'](sessionId, context, cb) {
		var wantedPics = allPics['corgis']
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
		return menu['Chinese'];
	}if(Type.toLowerCase() === 'Japanese'.toLowerCase()){
		return menu['Japanese'];
	}if(Type.toLowerCase() === 'Indian'.toLowerCase()){
		return  menu['Indian'];
	}if(Type.toLowerCase() === 'Spanish'.toLowerCase()){
		return menu['Spanish'];
	}if(Type.toLowerCase() === 'American'.toLowerCase()){
		return  menu['American'];
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

var menu_format=[
{
	"title": "Chinese",
    "subtitle": "Element #1 of an hscroll",
    "image_url": "http://messengerdemo.parseapp.com/img/rift.png"	
},
{
	"title": "Japanese",
    "subtitle": "Element #1 of an hscroll",
    "image_url": "http://messengerdemo.parseapp.com/img/rift.png"	
},
{
	"title": "Indian",
    "subtitle": "Element #1 of an hscroll",
    "image_url": "http://messengerdemo.parseapp.com/img/rift.png"	
},
{
	"title": "Spanish",
    "subtitle": "Element #1 of an hscroll",
    "image_url": "http://messengerdemo.parseapp.com/img/rift.png"	
},
{
	"title": "American",
    "subtitle": "Element #1 of an hscroll",
    "image_url": "http://messengerdemo.parseapp.com/img/rift.png"	
}
]

var menu = {
	Chinese:[{
		product:'Chow mein',
		price:100
	},{
		product:'Dim sum',
		price:150
	},{
		product:'Jiaozi',
		price:120
	},{
		product:'Ramen',
		price:80
	},{
		product:'Lo mein',
		price:150
	}
	],
	Japanese:[
		{
		product:'Sushi',
		price:100
	},{
		product:'Tempura',
		price:150
	},{
		product:'Sukiyaki',
		price:120
	},{
		product:'Ramen',
		price:80
	},{
		product:'Tonkatsu',
		price:80
	},{
		product:'Curry rice',
		price:150
	}
	],
	Indian:[
		{
		product:'Amritsari fish',
		price:100
	},{
		product:'Baati',
		price:150
	},{
		product:'Amritsari kulcha',
		price:120
	},{
		product:'Biryani',
		price:80
	},{
		product:'Butter chicken',
		price:80
	}
	],
	Spanish:[
		{
		product:'Escabeche',
		price:100
	},{
		product:'Gachas',
		price:150
	},{
		product:'Merienda',
		price:120
	},{
		product:'Paella',
		price:80
	}
	],
	American:[
	{
		product:'Bread',
		price:100
	},{
		product:'Barbecue',
		price:150
	},{
		product:'Blue Cheese Dressing',
		price:120
	},{
		product:'Brunswick Stew',
		price:80
	},{
		product:'Buffalo Burger',
		price:100
	},{
		product:'Buffalo Wing',
		price:150
	},{
		product:'Burnt Ends',
		price:120
	},{
		product:'Chicken And Waffles',
		price:80
	}
	]
}
