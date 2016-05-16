var MWBSInitSpace = MWBSInitSpace || {};
/* Registration and settings are defined here, users will supply their own username and key depending on which platform they will use
    @params 
        mwbs - is the MWBScanner object, passed from the plugin function
        constants - the constants used for scanner settings
        dvc - the device on which it runs
 
 
 */
MWBSInitSpace.init = function(mwbs,constants,dvc){
};
//custom callback function, one that can be modified by the user
MWBSInitSpace.callback = function(result){
    console.log('MWBSInitSpace.callback Invoked at: '+ (new Date()).getTime());
    
     /**
       * result.code - string representation of barcode result
       * result.type - type of barcode detected or 'Cancel' if scanning is canceled
       * result.bytes - bytes array of raw barcode result
       * result.isGS1 - (boolean) barcode is GS1 compliant
       * result.location - contains rectangle points p1,p2,p3,p4 with the corresponding x,y
       * result.imageWidth - Width of the scanned image
       * result.imageHeight - Height of the scanned image
       */
     
    console.log('Scan complete');
   if (result.type == 'Cancel'){
            //Perform some action on scanning canceled if needed
            } 
            else if (result && result.code){
               
                /*
                *  Use this sample if scanning in view 
                */
                /*
                var para = document.createElement("li");
                var node = document.createTextNode(result.code+" : "+result.type);
                para.appendChild(node);
                              
                var element = document.getElementById("mwb_list");
                element.appendChild(para);
                */          


                /*
                *  Use this sample when using mwbs['MWBcloseScannerOnDecode'](false);
                */
                /*
                 setTimeout(function(){                  
                    scanner.resumeScanning();   
                 },2000);                                
                */

               navigator.notification.alert(result.code, function(){}, result.type + (result.isGS1?" (GS1)":""), 'Close');

            }
}