angular.module('scanGluten.services', [])

.factory('userService', function($http, $q,$rootScope) {
	return {
        
        searchUnLabeled: function(producer,name){
            var q = $q.defer();
            query = {"query": {"bool": {"must": [{ "match": { "gf":  "0" }},{ "match": { "ngf": "0"}},{ "match": { "name": "\"" + name + "\""}},{ "match": { "producer": "\"" + producer + "\""}}]}}}
            
            if (!producer && producer.length == 0)
              query = {"query": {"bool": {"must": [{ "match": { "gf":  "0" }},{ "match": { "ngf": "0"}},{ "match": { "name": "\"" + name + "\""}}]}}}
            if (!name && name.length == 0)
              query = {"query": {"bool": {"must": [{ "match": { "gf":  "0" }},{ "match": { "ngf": "0"}},{ "match": { "producer": "\"" + producer + "\""}}]}}}
              
            $http.post("http://139.59.196.41:9200/gluten_beta2/item/_search?size=100",query).then(function(response){
            if (response.data.hits)
            {
                console.log("after response 11");
                console.log("after " + JSON.stringify(response));
                q.resolve(response.data.hits.hits);
            }
            else {
                console.log("after " + JSON.stringify(response.data));
                q.resolve(null);
            }                
            }, function(err) {
                console.log("after response 33 " + err);
                q.resolve(null);
            });

          return q.promise;
		},
    getUnLabeled: function(){
            var q = $q.defer();
                $http.post("http://139.59.196.41:9200/gluten_beta2/item/_search?size=100",{"query": {"bool": {"should": [{ "match": { "gf":  "0" }},{ "match": { "ngf": "0"}}]}}}).then(function(response){
            if (response.data.hits)
            {
                console.log("after response 11");
                console.log("after " + JSON.stringify(response));
                q.resolve(response.data.hits.hits);
            }
            else {
                console.log("after " + JSON.stringify(response.data));
                q.resolve(null);
            }                
            }, function(err) {
                console.log("after response 33 " + err);
                q.resolve(null);
            });

          return q.promise;
		},
		getProduct: function(barcode, sendAnalytics){
     console.log("after barcode" + barcode);

      var q = $q.defer();
			$http.get("http://139.59.196.41:9200/gluten_beta2/item/" + barcode).success(function(response){
         console.log("after response");
         console.log("after " + JSON.stringify(response));
        if (response.data.found) {
          if (sendAnalytics == 1) 
            analytics.trackEvent("ExistingProduct", 'Loaded',barcode,0);
          q.resolve(response.data._source);
        }
        else {
            if(sendAnalytics == 1) 
              analytics.trackEvent("NewProduct", 'Loaded',barcode,0);
            q.resolve(null);
        }
      }).error(function(data, status, headers, config) {
        console.log("after get http error: " + status + " kkkkk,,,.....................");
        console.log("after " + JSON.stringify(data));
        if (status == 404)
         if(sendAnalytics == 1) 
              analytics.trackEvent("NewProduct", 'Loaded',barcode,0);
           
        q.resolve(null);
      });
      
      return q.promise;
		},
		getMessages: function(barcode){
     console.log("after barcode" + barcode);

      var q = $q.defer();
			$http.get("http://139.59.196.41:9200/gluten_beta2/messages/" + barcode).then(function(response){
         console.log("after response");
         console.log("after " + JSON.stringify(response));
        if (response.data.found)
            q.resolve(response.data._source);
        else
            q.resolve(null);
      }, function(err) {
        console.log("after get http error");
        console.log("after " + JSON.stringify(err));
        q.resolve(null);
      });

      return q.promise;
		},
		updateMessages: function(id, params){

      var q = $q.defer();

			$http.post("http://139.59.196.41:9200/gluten_beta2/messages/" + id,params).then(function(response){
        q.resolve(response);
      }, function(err) {
        console.log(JSON.stringify(err));
        q.reject(err);
      });

      return q.promise;
    },
		updateProduct: function(id, params){

      var q = $q.defer();

			$http.post("http://139.59.196.41:9200/gluten_beta2/item/" + id,params).then(function(response){
        q.resolve(response);
      }, function(err) {
        console.log(JSON.stringify(err));
        q.reject(err);
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
      
      analytics.trackEvent('Scan', 'Start', '', $rootScope.scans);

      var scan = function(result){
        if (result.type == 'Cancel') {
            analytics.trackEvent('Scan', 'Stop', 'Canceled', $rootScope.scans);
            return;
        }
        
        analytics.trackEvent('Scan', 'Finished', result.code, $rootScope.scans);
        $state.go('detail', {barcode: result.code});
        };
                  
      var isIOS = ionic.Platform.isIOS();
      if (isIOS)
        scanner.startScanning(MWBSInitSpace.init,scan);
      else
        scanner.startScanning(MWBSInitSpace.init,scan,0,13,100,74);
    }}});
