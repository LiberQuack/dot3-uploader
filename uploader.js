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
UPLOADER = {
    send: function (address, files, json) {
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

        function Upload(address, files, json){
            this.req = new XMLHttpRequest();
            this.fd = new FormData();
            //Create the formdata
            this.fd.enctype = "multipart/form-data";
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
                    console.log(e.target.status);
                    if (e.target.readyState == XMLHttpRequest.DONE && (e.target.status >=200 && e.target.status <=299)) {
                        var data;
                        try {data = JSON.parse(req.response);} 
                        catch (error) {data = req.response;}
                        callback(data, req.status, req.getAllResponseHeaders().split("\n"));
                    } else {
                        e.target.onerror();
                    }
                }
                return this;
            },
            error: function(callback){
                var req = this.req;
                this.req.onerror = function(){
                    var data;
                    try {data = JSON.parse(req.response);} 
                    catch (error) {data = req.response;}
                    callback(data, req.status, req.getAllResponseHeaders().split("\n"));
                }
                return this;
            }
        }
        x = new Upload(address, files, json);
        return x;
    }
}
