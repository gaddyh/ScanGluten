// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('scanGluten', ['ionic','ionic.service.core','ionic.service.analytics', 'ngCordova', 'scanGluten.controllers', 'scanGluten.services'])

.config(function($stateProvider, $urlRouterProvider){

	$stateProvider

	.state('main', {
		url: "/main",
		nativeTransitions: {
			 "type": "zoomOutUp",
			 "direction": "down"
	 },
		templateUrl: "templates/main.html",
		controller: 'MainCtrl',
	})

  .state('detail', {
    url: "/detail/:barcode",
    templateUrl: "templates/detail.html",
    controller: "DetailCtrl",
  })

	.state('new', {
		 url: "/new/:param",
		 templateUrl: "templates/newProduct.html",
		 controller: "NewProductCtrl",
	 })
     
     .state('unLabedlItems', {
         url: "/unLabedlItems",
         templateUrl: "templates/unLabedlItems.html",
         controller: "UnLabedlItemsCtrl"
     })
     
     .state('messages', {
         url: "/messages/:barcode/:name",
         templateUrl: "templates/talkBack.html",
         controller: "MessagesCtrl"
     })

  $urlRouterProvider.otherwise('/main');
})

.run(function($ionicPlatform, $ionicAnalytics, $rootScope) {
  $ionicPlatform.ready(function() {
    
    $ionicAnalytics.register();
      
    $rootScope.scans=0;
    
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
    
    console.log(device.name);
    console.log(device.uuid);
    console.log(device.platfrom);
    console.log(device.version);
  });
})
