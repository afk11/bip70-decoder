
require('./bootstrap');

var TrustStore = bip70.X509.TrustStore;
var RequestValidator = bip70.X509.Validation.RequestValidator;
var PKIType = bip70.X509.PKIType;
var PaymentDetails = bip70.ProtoBuf.PaymentDetails;
var baddress = bitcoinjs.address;
var OPS_REVERSE = require('bitcoin-ops/map');

function clearBody() {
    $("#details").html("");
}

function formatSignatureAlgorithm(request, entityCert) {
    var publicKey = entityCert.getPublicKey();

    var keyType;
    if (publicKey.type === "ECDSA") {
        keyType = "ECDSA";
    } else if (publicKey.type === "RSA") {
        keyType = "RSA";
    } else {
        throw new Error("Unknown public key type");
    }

    var hashAlg;
    if (request.pkiType === PKIType.X509_SHA1) {
        hashAlg = "SHA1";
    } else if (request.pkiType === PKIType.X509_SHA256) {
        hashAlg = "SHA256";
    }
    return hashAlg + "with" + keyType;
}

function renderRequest(request, path) {
    var content = "";
    if (request.paymentDetailsVersion) {
        content += "Payment Details Version: " + request.paymentDetailsVersion + "<br />";
    }

    if (request.pkiType) {
        content += "<b>X509 Details</b><br />";
        if (!(request.pkiType === PKIType.X509_SHA256 || request.pkiType === PKIType.X509_SHA1 || request.pkiType === PKIType.NONE)) {
            content += "<b>Invalid PKI Type: " + request.pkiType + "!<br />";
        } else {
            if (request.pkiType === PKIType.NONE) {
                content += "<b>No PKI Data</b><br />";
            } else {
                content += "PKI Type: " + request.pkiType + "<br />";
                if (request.pkiType === "none" && typeof request.pkiData !== "undefined") {
                    content += "<b>Unexpected PKI data</b><br />";
                } else {
                    content += "Signature algorithm: " + formatSignatureAlgorithm(request, path[path.length-1]) + "<br />";
                    var depth = 0;
                    var latestNotBefore = new Date(0);
                    var latestNotBeforeDepth = new Date(0);
                    var earliestNotAfter = 0;
                    var earliestNotAfterDepth = 0;

                    path.map(function(certificate) {
                        content += " * Certificate (" + depth + ") " + certificate.getSubjectString() + "<br />";

                        var notBefore = jsrsasign.zulutodate(certificate.getNotBefore());
                        var notAfter = jsrsasign.zulutodate(certificate.getNotAfter());
                        if (notBefore > latestNotBefore) {
                            latestNotBefore = notBefore;
                            latestNotBeforeDepth = depth;
                        }

                        if (earliestNotAfter === 0 || notAfter < earliestNotAfter) {
                            earliestNotAfter = notAfter;
                            earliestNotAfterDepth = depth;
                        }
                        depth++;
                    });

                    if (earliestNotAfter && latestNotBefore) {
                        content += "Certificate chain valid between: " + latestNotBefore + " - " + earliestNotAfter + "<br />";
                    }
                }
            }
        }
    }

    var details = PaymentDetails.decode(request.serializedPaymentDetails);
    content += "<b>Payment Details</b><br />";
    if (details.network) {
        content += "Specified Network: " + details.network + "<br />";
    }
    var createdAt = new Date(details.time * 1000);
    content += "Created Time: " + createdAt + "<br />";

    if (details.expires) {
        var expiresAt = new Date(details.expires * 1000);
        content += "Expiry Time: " + expiresAt + "<br />";
        var lifetimeMins = Math.ceil((expiresAt-createdAt)/1000/60);
        content += "Invoice lifetime: " + lifetimeMins + " minutes<br />";
    }
    if (details.paymentUrl) {
        content += "Payment URL: " + details.paymentUrl + "<br />";
    }
    if (details.merchantData.length) {
        var merchantData = new Buffer(details.merchantData);
        content += "Merchant Data: " + merchantData.toString('utf-8') + "<br />";
    }

    if (details.outputs.length === 0) {
        content += "<b>No outputs in request</b><br />";
    } else {
        content += "<b>Output details</b><br />";
        content += '<ul class="list-group">';
        details.outputs.map(function (output) {

            var script = new Buffer(output.script);
            var scriptType = bitcoinjs.script.classifyOutput(script);

            var scriptOps = "";
            try {
                var decompiled = bitcoinjs.script.decompile(script);
                decompiled.map(function (op) {
                    if (op instanceof Buffer) {
                        scriptOps += "OP_PUSHDATA(" + op.length + ") " + op.toString('hex') + " "
                    } else {
                        scriptOps += OPS_REVERSE[op] + " ";
                    }
                });
            } catch (e) {
                scriptOps = "<b>Invalid script - fails to decompile<b/>";
            }
            var address = null;
            try {
                address = baddress.fromOutputScript(script);
            } catch (e) {}

            content += '<li class="list-group-item">';
            content += "Value: " + output.amount + " satoshis<br/>";
            content += "Script type: " + scriptType + "<br />";
            if (address) {
                content += "Address: " + address + "<br />";
            } else {
                content += "Script opcodes: " + scriptOps + "<br />";
            }
            content += "Script hex: " + script.toString('hex') + "<br />";
            content += "</li>";
        });
        content += '</ul>';
    }

    $("#details").html(content);
}

// borrowed from bip21, with a modification for optional addresses
// in urls.

function parseQuery(url) {
    url = (url || "").split("?");
    if (url.length < 2) {
        return {};
    }
    var qstr = url[1];
    var query = {};
    var a = qstr.split("&");
    for (var i = 0; i < a.length; i++) {
        var b = a[i].split("=");
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || "");
    }
    return query;
}

function decodeBitcoin (uri) {
    var qregex = /bitcoin:\/?\/?([^?]+)?(\?([^]+))?/.exec(uri);
    if (!qregex) throw new Error('Invalid BIP21 URI: ' + uri);

    var address = qregex[1];
    var query = qregex[3];

    var options = parseQuery("?"+query);
    if (options.amount) {
        options.amount = Number(options.amount);
        if (!isFinite(options.amount)) throw new Error('Invalid amount');
        if (options.amount < 0) throw new Error('Invalid amount');
    }

    return { address: address, options: options };
}

$(function () {
    var client = new bip70.HttpClient();

    $("#urlform").on("submit", function (e) {
        e.preventDefault();
        $("#qr").val()
        $("#qrerror").val()
        var url = $("#bitcoinurl").val();

        var paymentUrl;
        if (url.slice(0, 4) === "http") {
            console.log("looks like HTTP - try directly download request");
            paymentUrl = url;
        } else {
            try {
                console.log("Looks like bitcoin url")
                var decoded = decodeBitcoin(url);
                if (decoded.options.r) {
                    paymentUrl = decoded.options.r;
                } else {
                    alert("Doesn't look like a bip70 URL");
                }
            } catch (e) {
                alert("Invalid URL. Provide direct request URL, or a bip70 bitcoin uri - " + e.message);
            }
        }

        if (paymentUrl) {
            client
                .getRequest(paymentUrl, new RequestValidator({
                    trustStore: TrustStore
                }))
                .then(function (requestData) {
                    var paymentRequest = requestData[0];
                    var path = requestData[1];
                    renderRequest(paymentRequest, path);

                    console.log("decode invoice");

                    try {
                        var details = PaymentDetails.decode(paymentRequest.serializedPaymentDetails);
                    } catch (e) {
                        console.log(e.message);
                        alert(e.message);
                    }

                    console.log("decoded invoice");
                    if (details.outputs.length > 1) {
                        console.log("decoded output");

                        $("#qrerror").val("Unable to generate BIP21 url, this invoice has multiple outputs");
                    } else if (details.outputs.length === 1) {
                        console.log("decode output");
                        try {
                        var script = Buffer.from(details.outputs[0].script);
                        console.log("decode script");
                        var amount = details.outputs[0].amount;
                        console.log("decode amount");
                            var address = null;
                            console.log("decode address");
                            address = baddress.fromOutputScript(script);
                        } catch (e) {
                            console.log("addresserror");
                            $("#qrerror").val("No address type for this script, cannot generate QR or bip21 link");
                        }

                        var bitcoinUri = "bitcoin:" + address + "?amount=" + (parseInt(amount, 10) / 1e8);
                        $("a").attr("href", bitcoinUri)

                        console.log("bitcoinURI", bitcoinUri);
                        var qr = new QRious({
                            element: document.getElementById('qr'),
                            value: bitcoinUri,
                            size: 300
                        });
                    }

                }, function (error) {
                    alert("received error " + error.message);
                });
        }
    });
});
