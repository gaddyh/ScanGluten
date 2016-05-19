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

    /*
    $scope.messages = [{"bla":"any"},{"bla":"any2"}, 
    {"bla":"yes very good 3"},
    {"bla":"yes very good 3"},
    {"bla":"yes"},
    {"bla":" very good 3"},
    {"bla":" very good 3"},
    {"bla":" very good 3"},
    {"bla":" very good 3"},
    {"bla":" very good 3"},
    {"bla":" very good 3"},
    {"bla":" very good 3"},
    ];
    */
    
    $scope.addMessage = function(msg){
        
        if ($scope.messages == null)
            $scope.messages =[];
            
        $scope.messages.push(msg)
        
        var params = {"messages": $scope.messages};
        userService.updateMessages($stateParams.barcode, params).then(function(data){
        });
    }
    
    
})

.controller("MainCtrl",function($rootScope,$scope, $ionicPlatform,$state,$ionicAnalytics, analytics){

analytics.trackView("Main");

customBackFunction = function(){
    console.log("stop scanner");
    scanner.closeScanner();

    $rootScope.deregisterHardBack();
}

$scope.onSwipeRight = function (){
    console.log("stop scanner");
    scanner.closeScanner();
    
    $rootScope.deregisterHardBack();
}

$scope.Scan = function(){
    var debug = false;   
    if(debug) 
        $state.go('detail', {barcode: 7290106657403});
    else {
            // override hard back
            // registerBackButtonAction() returns a function which can be used to deregister it
            $rootScope.deregisterHardBack = $ionicPlatform.registerBackButtonAction(
                customBackFunction, 101
            );
 
        $rootScope.scans += 1;
        console.log( "scans " + $rootScope.scans);

        analytics.trackEvent('Scan', 'Start', '', $rootScope.scans);

        $ionicAnalytics.track("ScanStart", {uuid: device.uuid, scans: $rootScope.scans})

        
      var isIOS = ionic.Platform.isIOS();
      if (isIOS)
        scanner.startScanning(MWBSInitSpace.init,function(result){
            if (result.type == 'Cancel')
            return;
            $state.go('detail', {barcode: result.code});
            });
        else
            scanner.startScanning(MWBSInitSpace.init,function(result){
                if (result.type == 'Cancel') {
                    analytics.trackEvent('Scan', 'Finished', 'Canceled', $rootScope.scans);
                    return;
                }
                
                analytics.trackEvent('Scan', 'Finished', result.code, $rootScope.scans);
                $state.go('detail', {barcode: result.code});
                },0,13,100,74);
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

// too many barcodes, wait until export is possible from analytics
//$ionicAnalytics.track("DetailsLoaded", {barcode: $stateParams.barcode })


$scope.show = function() {
    $ionicLoading.show({
      template: 'טוען'
    });
  };
  $scope.hide = function(){
    $ionicLoading.hide();
  };
  
  
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
   
    userService.getProduct($stateParams.barcode).then(function(response){
            console.log("response 1 " + response);
            if(response == null) {
                
                $scope.item.gf=0;
                $scope.item.ngf=0;
                
                if(sendAnalytics == 1) {
                    analytics.trackEvent("NewProduct", 'Loaded',$stateParams.barcode,0);
                    $ionicAnalytics.track("NewProduct", {uuid: device.uuid});
                    $scope.isNewProduct=1;
                }
            }
            else {
                    $scope.item = response;

                    if (sendAnalytics == 1) {
                        analytics.trackEvent("ExistingProduct", 'Loaded',$stateParams.barcode,0);
                        $ionicAnalytics.track("ExistingProduct", {uuid: device.uuid});
                    }
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
