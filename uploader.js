"use strict";
/**
* ---------------------------------------------------------------------------
* Description:
* 
*   Post Files and JSON Objects to the server with no page reloading and 
*   progress handling.
*   This script works with XMLHttpRequest and FormData
* ---------------------------------------------------------------------------
* Parameters:
* 
*   @param address
*   @param files
*   @param json 
* ---------------------------------------------------------------------------
* Throws:
* 
*   ReferenceError, SyntaxError
* ---------------------------------------------------------------------------
*/
(function(global){
    global.UPLOADER = {
        send: function (address, files, json) {

            //Validators
            if (!FormData && !XMLHttpRequest && !JSON) {
                throw new ReferenceError("Browser is not suported");
            }
            if (!(typeof address === 'string')) {
                throw new SyntaxError("Illegal address, the first parameter must be a string");
            }
            function fileValidator(file) {
                if ((file instanceof Array || file instanceof FileList || file instanceof File || file instanceof Blob || file instanceof FileList)) {
                    return file;
                }
            }
            files = fileValidator(files);

            //Response body parser
            function parserResBody(body){
                var obj;
                try {obj = JSON.parse(body)}
                catch (err) {obj = body};
                return obj;
            }
            
            //Response headers parser
            function parserResHeaders(headers){
                var json = {}
                for (var i = 0; i < headers.length; i++){
                    var item = headers[i];
                    var key = item.substring(0, item.indexOf(":")).trim();
                    var value = item.substring(item.indexOf(":") + 1).trim();
                    if(key){
                        json[key] = value;
                    }
                }
                return json;
            }

            //Constructor
            function Upload(address, files, json){
                this.req = new XMLHttpRequest();
                this.fd = new FormData();
                if (json) {this.fd.append("json", JSON.stringify(json))};
                if (files instanceof Array || files instanceof FileList) {
                    for (var i = 0; i < files.length; i++) {
                        if (fileValidator(files[i])) {
                            this.fd.append("file" + i, fileValidator(files[i]));
                        } else {
                            throw new SyntaxError("The Array must contain only File or Blob")
                        }
                    }
                    files = false;
                }
                if (files) {
                    this.fd.append("file", files);
                }
                this.req.open("POST", address);
                this.req.send(this.fd);
            }

            //Upload functions
            Upload.prototype = {
                progress: function(callback){
                    this.req.upload.onprogress = function(e) {
                        var loaded = e.loaded/e.total;
                        callback(+(loaded.toString() !== "NaN" && loaded), e.total, e.loaded);
                    }
                    return this;
                },
                success: function(callback){
                    var req = this.req;
                    this.req.onloadend = function(e){
                        if (e.target.readyState == XMLHttpRequest.DONE && (e.target.status >=200 && e.target.status <=299)) {
                            callback(parserResBody(req.response), req.status, parserResHeaders(req.getAllResponseHeaders().split("\n")));
                        } else {
                            if (e.target.err){
                                e.target.err();
                            }
                        }
                    }
                    return this;
                },
                error: function(callback){
                    //Creating new property err to XMLHttpRequest for handling calling 2 times the error event
                    var req = this.req;
                    this.req.err = function(){
                        callback(parserResBody(req.response), req.status, parserResHeaders(req.getAllResponseHeaders().split("\n")));
                    }
                    return this;
                }
            }

            return new Upload(address, files, json);
        }
    }
}(this))