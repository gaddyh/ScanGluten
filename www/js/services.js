angular.module('scanGluten.services', [])

.factory('http', function($http, $q,$rootScope) {
  return {
    get: function(esType, barcode, sendAnalytics,category){
     console.log("after barcode" + barcode);

      var q = $q.defer();
			$http.get("http://139.59.196.41:9200/gluten_beta2/" + esType + "/" + barcode).success(function(response){
         console.log("after response");
         console.log("after " + JSON.stringify(response));
        if (response.found) {
          if (sendAnalytics == 1) 
            analytics.trackEvent(category, 'Found',barcode,0);
          q.resolve(response._source);
        }
        else {
            if(sendAnalytics == 1) 
              analytics.trackEvent(category, 'NotFound',device.uuid,0);
            q.resolve(null);
        }
      }).error(function(data, status, headers, config) {
        console.log("after get http error: " + status + " kkkkk,,,.....................");
        console.log("after " + JSON.stringify(data));
        if (status == 404) {
         if(sendAnalytics == 1) 
              analytics.trackEvent(category, '404',device.uuid,0);
        }
        else
        {
            analytics.trackEvent(category, 'GetError',device.uuid,0);
            analytics.trackException(data, false)
        }
        q.resolve(null);
      });
      
      return q.promise;
		},
    post: function(esType, id, params, category){

      var q = $q.defer();

			$http.post("http://139.59.196.41:9200/gluten_beta2/" + esType + "/" + id,params).then(function(response){
        console.log(JSON.stringify(response));
        if (response.data.created)
          analytics.trackEvent(category, 'Create', id);
        else
          analytics.trackEvent(category, 'Update', id);
          
        q.resolve(response);
      }, function(err) {
          analytics.trackEvent(category, 'PostError', id);
          analytics.trackException(err, false)
          q.reject(err);
      });

      return q.promise;
    }
  }
})

.factory('userService', function($http, $q,$rootScope) {
	return {
        
        searchGFByName: function(name,producer){
            var q = $q.defer();
            matches=[];
            
            if (name && name.length>0) {
              literals = name.split(" ");
              for (i = 0; i < literals.length; i++) { 
                  matches.push( {  "match": { "name": "\"" + literals[i] + "\""  }} );
              }
            }
            
            if (producer && producer.length>0) {
              literals = producer.split(" ");
              for (i = 0; i < literals.length; i++) { 
                  matches.push( {  "match": { "producer": "\"" + literals[i] + "\""  }} );
              }
            }
            
            query = {"query": {
                      "filtered": {
                        "filter": {
                          "script": {
                            "script": "doc[\"gf\"].value > doc[\"ngf\"].value"
                          }
                        },
                        "query": {
                          "bool": {
                            "must": 
                              matches
                          }
                        }
                      }
                    }
                  }
                  
            console.log(JSON.stringify(query));
            

            var d = "";
            if (name && name.length>0) 
              d += name;
          if (producer && producer.length>0) 
              d += " " + producer;
          
            $http.post("http://139.59.196.41:9200/gluten_beta2/item/_search?size=100",query).then(function(response){
            if (response.data.hits)
            {
                analytics.trackEvent('Search', 'Success', d,response.data.hits.total);

                console.log("after search hits " + response.data.hits.total);
                //console.log("after " + JSON.stringify(response));
                console.log("after search: " + d);
                q.resolve(response.data.hits.hits);
            }
            else {
                console.log("after " + JSON.stringify(response.data));
                q.resolve(null);
            }                
            }, function(err) {
                analytics.trackEvent('Search', 'Error', d);
                console.log("after response 33 " + err);
                q.resolve(null);
            });

          return q.promise;
		},
	}
})

.factory('Camera', ['$q', function($q) {

  return {
    getPicture: function(options) {
      var q = $q.defer();
      var options = {destinationType : Camera.DestinationType.DATA_URL,
        sourceType : Camera.PictureSourceType.CAMERA,
        quality: 100,
        encodingType: Camera.EncodingType.JPEG,
    targetWidth: 150,
    targetHeight: 400,
    correctOrientation: true};
      navigator.camera.getPicture(function(result) {
        // Do any magic you need
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);

      return q.promise;
    }
  }
}])

.factory("analytics", function($ionicPlatform){
  return {
    trackView: function(viewName) {
      $ionicPlatform.ready(function () {
        if(typeof analytics !="undefined") {
          analytics.trackView(viewName);
        } else {
            console.log("Google Analytics Unavailable");
          }
        }
      )  
    },
    trackEvent: function(category, action, label, value ) {
      $ionicPlatform.ready(function () {
        if(typeof analytics !="undefined") {
          analytics.trackEvent(category, action, label, value);
        } else {
            console.log("Google Analytics Unavailable");
          }
        }
      )  
    }
  }})
  
  .factory("scannerHelper", function($rootScope, analytics, $state){
  return {
    startScanning: function() {
      
      analytics.trackEvent('Scan', 'Start', device.uuid, $rootScope.scans);
      $rootScope.startScan = Date.now();

      var scan = function(result){
        if (result.type == 'Cancel') {
            analytics.trackEvent('Scan', 'Canceled',device.uuid, $rootScope.scans);
            return;
        }
        
      var end = Date.now();
        var inter = end - $rootScope.startScan;
        analytics.trackEvent('Scan', 'Success', result.code, $rootScope.scans);
        analytics.trackEvent('Scan', 'Timing', result.type, inter);
        //console.log("scan timing: " + inter );
//        analytics.trackTiming('Scan', inter, result.code, result.type);
        //analytics.trackTiming('Scan', "3456", "sdsd", "sdsd");
        $state.go('detail', {barcode: result.code});
        };
                  
      var isIOS = ionic.Platform.isIOS();
      if (isIOS)
        scanner.startScanning(MWBSInitSpace.init,scan);
      else
        scanner.startScanning(MWBSInitSpace.init,scan,0,13,100,74);
    }}})

.factory('toast', function($cordovaToast){
       return {
        showToast:  function(message, duration, location) {
        $cordovaToast.show(message, duration, location).then(function(success) {
            console.log("The toast was shown");
        }, function (error) {
            console.log("The toast was not shown due to " + error);
        });
    }
    }
    })
    
    .factory('detailsHelper', function($rootScope, analytics){
       return {
        setup:  function() {
              if ($rootScope.deregisterHardBack != null)
                $rootScope.deregisterHardBack();
        
              scanner.closeScanner();
              $rootScope.scans -= 1 ;
              
              analytics.trackView("DetailsLoaded");
        }
      }
    })
    
    .factory('loadingHelper', function($ionicLoading){
       return {
        show:  function() {
            $ionicLoading.show({ template: 'טוען' });
          },
        hide: function() {
          $ionicLoading.hide();
        }
      }
    });

