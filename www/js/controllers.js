angular.module('scanGluten.controllers', [])


.controller("MessagesCtrl",function(http, $rootScope,$scope, $ionicPlatform,$state,$ionicAnalytics,$stateParams, $ionicHistory, analytics){

    analytics.trackView("Messages");

    $scope.name = $stateParams.name;

    $scope.onSwipeLeft = function(){
        $ionicHistory.goBack(-2);
    }
    
    $scope.onSwipeRight = function(){
        $ionicHistory.goBack();
    }
      
    $scope.go = function(link){
        cordova.InAppBrowser.open(link, "_system");
    }
    
    http.get("messages",$stateParams.barcode, 1, "Messages").then(function(response){
        if (response != null)
            $scope.messages = response.messages;
    });

    //$scope.messages = [{"bla":"any"},{"bla":"any2"},];
    
    $scope.addMessage = function(msg){
        
        if ($scope.messages == null)
            $scope.messages =[];
            
        $scope.messages.push(msg)
        
        var params = {"messages": $scope.messages};
        http.post("messages", $stateParams.barcode, params, "Messages").then(function(data){
        });
    }
})

.controller("MainCtrl",function($rootScope,$scope, $ionicPlatform,$state,$ionicAnalytics, analytics,scannerHelper){

    analytics.trackView("Main");

    customBackFunction = function(){
        console.log("stop scanner");
        scanner.closeScanner();

        analytics.trackEvent('Scan', 'Stop', 'Canceled', $rootScope.scans);

        $rootScope.deregisterHardBack();
    }

    $scope.onSwipeRight = function (){
        console.log("stop scanner");
        scanner.closeScanner();
        analytics.trackEvent('Scan', 'Stop', 'Canceled', $rootScope.scans);
        
        $rootScope.deregisterHardBack();
    }

    $scope.onSwipeUp = function (){
    $state.go('search');
    }

    $scope.Scan = function(){
        var debug = false;   
        if(debug) { 
            analytics.trackEvent('ScanDebug', 'Start', '', 5);
            $state.go('detail', {barcode: 432});
        }
        else {
            $rootScope.deregisterHardBack = $ionicPlatform.registerBackButtonAction(customBackFunction, 101);

            $rootScope.scans += 1;
            console.log( "scans " + $rootScope.scans);

            $ionicAnalytics.track("ScanStart", {uuid: device.uuid, scans: $rootScope.scans})

            scannerHelper.startScanning($rootScope, analytics, $state);
        }
    }
})

.controller("UnLabedlItemsCtrl", function($scope, userService,$state,$ionicHistory){
    
    $scope.onSwipeRight = function(){
    $ionicHistory.goBack();
  }

    $scope.search = function()
    {
        items=[]
        
        if ( ($scope.name && $scope.name.length>0) || ($scope.producer && $scope.producer.length>0)) 
            userService.searchGFByName($scope.name, $scope.producer).then(function(response){
                console.log("response 1 " + response);
                if(response == null) {
                }
                else
                {
                    for (var i = 0; i < response.length; i++) {
                        if(!response[i]._source.name || response[i]._source.name.length == 0)
                            d=1
                        else {
                                console.log("push " + JSON.stringify(response[i]._source));
                            
                            items.push(response[i]._source)
                        }
                    }
                    $scope.items = items;
                }
            });
    }
    
    $scope.openDetails = function(code){
            $state.go('detail', {barcode: code});
    }
})

.controller("DetailCtrl",function($rootScope, http, $scope, $state, $stateParams, Camera, toast, $ionicLoading, $ionicAnalytics, $ionicHistory, analytics,detailsHelper, loadingHelper){

    detailsHelper.setup();
    
    var disableUpdate=0;

    $scope.refresh = function(sendAnalytics){

        loadingHelper.show();

        $scope.item = {};
        $scope.item.barcode = $stateParams.barcode;
    
        http.get("item",$stateParams.barcode, sendAnalytics, "Product").then(function(response){
                if(response == null) {
                    $scope.item.gf=0;
                    $scope.item.ngf=0;
                }
                else {
                        $scope.item = response;
                        analytics.trackEvent("Product",'Load', device.uuid);
                }                
                loadingHelper.hide();
        });
    }

    $scope.refresh(1);
    
    $scope.user = {};
    
    http.get("user",device.uuid, 1, "User").then(function(response){
        if (response != null) {   
            $scope.userMarkedBarcodes = response.barcodes;
            
            if ($scope.userMarkedBarcodes.indexOf($stateParams.barcode) > -1) // contains 
                disableUpdate = 1;
            else
                disableUpdate = 0;
        }
        else
            disableUpdate = 0;
    });

    $scope.onPhoto = function(){

        Camera.getPicture().then(function(image) {
            $scope.item.image=image;
        }, function(err) {
            console.err(err);
        });
    }

    $scope.update = function(){
        console.log("now: " + Date.now());
        $scope.item.timestamp=Date.now();
        http.post("item",$scope.item.barcode, $scope.item, "Product").then(function(data){
            console.log(JSON.stringify($scope.item));
        });
        
        toast.showToast('תודה רבה', 'short', 'bottom');
        $state.go('main');
    }

    $scope.glutenClick = function(gfClicked){
        if (disableUpdate == 0) {
            if(gfClicked) {
                var gf =parseInt($scope.item.gf, 10);
                $scope.item.gf = gf + 1;
            } 
            else {
                var ngf =parseInt($scope.item.ngf, 10);
                $scope.item.ngf = ngf + 1;
            }
            http.post("item",$scope.item.barcode, $scope.item, "Product").then(function(data){
            });
            
            if ($scope.userMarkedBarcodes == null)
                $scope.userMarkedBarcodes =[];
            
            $scope.userMarkedBarcodes.push($scope.item.barcode)
        
            var params = {"barcodes": $scope.userMarkedBarcodes};
            http.post("user",device.uuid, params, "User").then(function(data){
            });
            
            disableUpdate = 1;
        }
        else {
            toast.showToast("תודה, כבר חווית דעה", 'short', 'bottom');
        }
    }

    $scope.gfClick = function(){
        $scope.glutenClick(true);
    }
    
    $scope.ngfClick = function(){
        $scope.glutenClick(false);
    }

    $scope.onSwipeRight = function(){
        $ionicHistory.goBack();
    }

    $scope.onSwipeLeft = function(){
        $state.go('messages', {barcode: $scope.item.barcode, name: $scope.item.name});
    }
  
    $scope.$on('$ionicView.enter', function(e) {
        $scope.refresh(0);
    });
 	
})

.controller('FirstTimeCtrl', ['$scope', '$state',  function($scope, $state) {
  
   $scope.showAgain = function() {
     $state.go("main");  
   }
   
   $scope.lastTime = function() {
     window.localStorage['firstTimeUse'] = 'no';
     $state.go("main");  
   }
}])

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

