angular.module('scanGluten.controllers', [])


.controller("MessagesCtrl",function(userService, $rootScope,$scope, $ionicPlatform,$state,$ionicAnalytics,$stateParams,$ionicViewService, $ionicHistory, analytics){

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
    
    userService.getMessages($stateParams.barcode).then(function(response){
        if (response != null)
            $scope.messages = response.messages;
    });

    //$scope.messages = [{"bla":"any"},{"bla":"any2"},];
    
    $scope.addMessage = function(msg){
        
        if ($scope.messages == null)
            $scope.messages =[];
            
        $scope.messages.push(msg)
        
        var params = {"messages": $scope.messages};
        userService.updateMessages($stateParams.barcode, params).then(function(data){
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

$scope.Scan = function(){
    var debug = false;   
    if(debug) 
        $state.go('detail', {barcode: 7290106657403});
    else {
        $rootScope.deregisterHardBack = $ionicPlatform.registerBackButtonAction(customBackFunction, 101);

        $rootScope.scans += 1;
        console.log( "scans " + $rootScope.scans);

        $ionicAnalytics.track("ScanStart", {uuid: device.uuid, scans: $rootScope.scans})

        scannerHelper.startScanning($rootScope, analytics, $state);
    }
    }
})

.controller("UnLabedlItemsCtrl", function($scope, userService,$state){
    
    $scope.search = function()
    {
        items=[]
        
        if ($scope.producer.length>0)
            userService.searchUnLabeled($scope.producer, $scope.product).then(function(response){
                console.log("response 1 " + response);
                if(response == null) {
                    alert("null")
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
    items=[]
     userService.getUnLabeled().then(function(response){
            console.log("response 1 " + response);
            if(response == null) {
                alert("null")
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
})

.controller("DetailCtrl",function($rootScope, userService, $scope, $state, $stateParams, Camera, $cordovaToast, $ionicModal, $ionicLoading, $ionicAnalytics, $ionicViewService, $ionicHistory, analytics){

    $rootScope.deregisterHardBack();
    $scope.isNewProduct=0;
    var disableUpdate=0;
    scanner.closeScanner();

    $rootScope.scans -= 1 ;

    analytics.trackView("DetailsLoaded");
    $ionicAnalytics.track("DetailsLoaded", {uuid: device.uuid, scans: $rootScope.scans})

    $scope.show = function() {    $ionicLoading.show({ template: 'טוען' });};

    $scope.hide = function(){$ionicLoading.hide();};

    $ionicModal.fromTemplateUrl('templates/newProduct.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.modal = modal;
    });

 $scope.showToast = function(message, duration, location) {
        $cordovaToast.show(message, duration, location).then(function(success) {
            console.log("The toast was shown");
        }, function (error) {
            console.log("The toast was not shown due to " + error);
        });
    }
    
    
$scope.refresh = function(sendAnalytics){

  $scope.show();

    $scope.item = {};
    $scope.item.barcode = $stateParams.barcode;
   
    userService.getProduct($stateParams.barcode, sendAnalytics).then(function(response){
            if(response == null) {
                $scope.item.gf=0;
                $scope.item.ngf=0;
                $scope.isNewProduct=1;

                $ionicAnalytics.track("NewProduct", {uuid: device.uuid});
            }
            else {
                    $scope.item = response;
                    $ionicAnalytics.track("ExistingProduct", {uuid: device.uuid});
            }                
            $scope.hide();
     });
 }

$scope.refresh(1);

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
    userService.updateProduct($scope.item.barcode, $scope.item).then(function(data){
      console.log(JSON.stringify($scope.item));
    });
    
    if ($scope.isNewProduct == 1) {
        analytics.trackEvent('NewProduct', 'Created',$scope.item.barcode,0);    
        $ionicAnalytics.track("UpdateNewProduct", {uuid: device.uuid});
    } else {
        analytics.trackEvent('ExistingProduct', 'Updated',$scope.item.barcode,0);    
        //$ionicAnalytics.track("UpdateNewProduct", {uuid: device.uuid});
    }
    
    $scope.showToast('תודה רבה', 'short', 'bottom');
    $state.go('main');
  }

  $scope.gfClick = function(){
    if (disableUpdate == 0) {
        var gf =parseInt($scope.item.gf, 10);
        $scope.item.gf = gf + 1;
        userService.updateProduct($scope.item.barcode, $scope.item).then(function(data){
        });
        disableUpdate = 1;
    }
    else {
        $scope.showToast("תודה, כבר חווית דעה", 'short', 'bottom');
    }
  }

  $scope.ngfClick = function(){
      if (disableUpdate == 0) {
        var ngf =parseInt($scope.item.ngf, 10);
        $scope.item.ngf = ngf + 1;
        userService.updateProduct($scope.item.barcode, $scope.item).then(function(data){
        });
        disableUpdate = 1;
    }
    else {
        $scope.showToast("תודה, כבר חווית דעה", 'short', 'bottom');
    }
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

	
   $scope.openModal = function() {
      $scope.modal.show();
   };
	
   $scope.closeModal = function() {
      $scope.modal.hide();
   };
	
   //Cleanup the modal when we're done with it!
   $scope.$on('$destroy', function() {
      $scope.modal.remove();
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
}]);

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});
