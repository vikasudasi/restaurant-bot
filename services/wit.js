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

var isMenuImagesSent;
var isSubMenuImageSent;


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

		if (isMenuImagesSent) {
			console.log("checkURL true"+JSON.stringify(message));
			FB.newMessage(context._fbid_, context.menuitems, true);
			isMenuImagesSent=false;
		}else if(isSubMenuImageSent)
		{
			console.log("checkURL true"+JSON.stringify(message));
			FB.newMessage(context._fbid_, context.submenu_items, true);
			isSubMenuImageSent=false;
		}
		else {

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
			isMenuImagesSent=true;
		
		
		cb(context)
	},

	// list of functions Wit.ai can execute
	['getSubMenu'](sessionId, context, cb) {
		
		console.log("context: "+JSON.stringify(context));
		
		if (context['menu_type']) {
		
			context.submenu_items = getMenu(context.menu_type)
			
		}
		isSubMenuImageSent=true;
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
    "subtitle": "Please Type Chinese",
    "image_url": "https://media-cdn.tripadvisor.com/media/photo-s/03/34/77/5f/jack-s-chinese-restaurant.jpg"	
},
{
	"title": "Japanese",
    "subtitle": "Please Type Japanese",
    "image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"	
},
{
	"title": "Indian",
    "subtitle": "Please Type Indian",
    "image_url": "http://topholidays.net/wp-content/uploads/2014/04/indian-food.jpg"	
},
{
	"title": "Spanish",
    "subtitle": "Please Type Spanish",
    "image_url": "http://www1.expatica.com/upload/casey/ESfood1c.jpg"	
},
{
	"title": "American",
    "subtitle": "Please Type American",
    "image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"	
}
]

var menu = {
	Chinese:[{
		"title":'Chow mein',
		"subtitle":100,
		"image_url": "https://media-cdn.tripadvisor.com/media/photo-s/03/34/77/5f/jack-s-chinese-restaurant.jpg"	

	},{
		"title":'Dim sum',
		"subtitle":150,
		"image_url": "https://media-cdn.tripadvisor.com/media/photo-s/03/34/77/5f/jack-s-chinese-restaurant.jpg"	

	},{
		"title":'Jiaozi',
		"subtitle":120,
		"image_url": "https://media-cdn.tripadvisor.com/media/photo-s/03/34/77/5f/jack-s-chinese-restaurant.jpg"
	},{
		"title":'Ramen',
		"subtitle":80,
		"image_url": "https://media-cdn.tripadvisor.com/media/photo-s/03/34/77/5f/jack-s-chinese-restaurant.jpg"
	},{
		"title":'Lo mein',
		"subtitle":150,
		"image_url": "https://media-cdn.tripadvisor.com/media/photo-s/03/34/77/5f/jack-s-chinese-restaurant.jpg"
	}
	],
	Japanese:[
		{
		"title":'Sushi',
		"subtitle":100,
		"image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"
	},{
		"title":'Tempura',
		"subtitle":150,
		"image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"
	},{
		"title":'Sukiyaki',
		"subtitle":120,
		"image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"
	},{
		"title":'Ramen',
		"subtitle":80,
		"image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"
	},{
		"title":'Tonkatsu',
		"subtitle":80,
		"image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"
	},{
		"title":'Curry rice',
		"subtitle":150,
		"image_url": "https://www.whatsuplife.in/gurgaon/blog/wp-content/uploads/2015/01/japanese-food.jpg"
	}
	],
	Indian:[
		{
		"title":'Amritsari fish',
		"subtitle":100,
		 "image_url": "http://topholidays.net/wp-content/uploads/2014/04/indian-food.jpg"
	},{
		"title":'Baati',
		"subtitle":150,
		 "image_url": "http://topholidays.net/wp-content/uploads/2014/04/indian-food.jpg"
	},{
		"title":'Amritsari kulcha',
		"subtitle":120,
		 "image_url": "http://topholidays.net/wp-content/uploads/2014/04/indian-food.jpg"
	},{
		"title":'Biryani',
		"subtitle":80,
		 "image_url": "http://topholidays.net/wp-content/uploads/2014/04/indian-food.jpg"
	},{
		"title":'Butter chicken',
		"subtitle":80,
		"image_url": "http://topholidays.net/wp-content/uploads/2014/04/indian-food.jpg"
	}
	],
	Spanish:[
		{
		"title":'Escabeche',
		"subtitle":100,
		"image_url": "http://www1.expatica.com/upload/casey/ESfood1c.jpg"
	},{
		"title":'Gachas',
		"subtitle":150,
		"image_url": "http://www1.expatica.com/upload/casey/ESfood1c.jpg"
	},{
		"title":'Merienda',
		"subtitle":120,
		"image_url": "http://www1.expatica.com/upload/casey/ESfood1c.jpg"
	},{
		"title":'Paella',
		"subtitle":80,
		"image_url": "http://www1.expatica.com/upload/casey/ESfood1c.jpg"
	}
	],
	American:[
	{
		"title":'Bread',
		"subtitle":100,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Barbecue',
		"subtitle":150,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Blue Cheese Dressing',
		"subtitle":120,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Brunswick Stew',
		"subtitle":80,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Buffalo Burger',
		"subtitle":100,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Buffalo Wing',
		"subtitle":150,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Burnt Ends',
		"subtitle":120,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	},{
		"title":'Chicken And Waffles',
		"subtitle":80,
		"image_url": "http://i.telegraph.co.uk/multimedia/archive/03262/burgerss_3262533b.jpg"
	}
	]
}
