require("globals");
var platform = require("platform");
var fs = require("file-system");
var utils = require("utils/utils");
function downloadPDF(msg) {
    var path = msg.data.path;
    var link = msg.data.link;
    if (platform.isAndroid) {
        var output;
        var input;
        var interval;
        var progress = 0;
        var previous = 0;
        try {
            var count = 0;
            var uri = new java.net.URI(link);
            var url = uri.toURL();
            var connection = url.openConnection();
            fs.File.fromPath(path);
            var file = new java.io.File(path);
            var fileSize = connection.getContentLength();
            var data = Array.create("byte", 4096);
            var total = 0;
            var responseCode = connection.getResponseCode();
            var times = 0;
            if (responseCode === 200) {
                input = new java.io.BufferedInputStream(url.openStream());
                output = new java.io.FileOutputStream(file);

                global.postMessage({
                    status: 1
                });
                postMessage({ progress: progress });
                while ((count = input.read(data)) != -1) {
                    total += count;
                    progress = Math.floor((total * 100) / fileSize);;
                    if (progress > previous) {
                        postMessage({ progress: progress });
                        previous = progress;
                    }
                    output.write(data, 0, count);
                }
                if ((count = input.read(data)) === -1) {
                    global.postMessage({
                        status: 2
                    });
                    output.flush();
                    output.close();
                    input.close();
                }
            }
            else {
                postMessage({ type: "error", code: responseCode });
            }
        } catch (e) {
            console.log(e);
            postMessage({ type: "error", code: responseCode });
        }

    } else if (platform.isIOS) {

        var getter = utils.ios.getter;
        var NSURLSessionDownloadDelegateImpl = require("./ios/NSURLSessionDownloadDelegateImpl").NSURLSessionDownloadDelegateImpl;

        try {
            var queue = getter(NSOperationQueue, NSOperationQueue.mainQueue);
            var downloadRequest = NSMutableURLRequest.requestWithURL(NSURL.URLWithString(link));
            var delegate = NSURLSessionDownloadDelegateImpl.initWithPathProgressCompletion(path, function (progress) {
                global.postMessage(progress);
            }, function (completed, filePath) {
                if (completed) {
                    global.postMessage({
                        status: 2,
                        filePath: filePath
                    });
                }
            });

            var sessionConfig = getter(NSURLSessionConfiguration, NSURLSessionConfiguration.defaultSessionConfiguration);
            var application = getter(UIApplication, UIApplication.sharedApplication);
            var urlSession = NSURLSession.sessionWithConfigurationDelegateDelegateQueue(sessionConfig, delegate, queue);
            var downloadTask = urlSession.downloadTaskWithRequest(downloadRequest);
            downloadTask.resume();
            global.postMessage({
                status: 1
            });

        } catch (ex) {

            console.log(ex)
        }

    }
}
global.onmessage = function (msg) {
    downloadPDF(msg)
}