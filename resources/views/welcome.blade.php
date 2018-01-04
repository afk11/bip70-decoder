
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>Grid Template for Bootstrap</title>

    <link href="css/app.css" rel="stylesheet">

</head>

<body>
<div class="container">
    <div class="row">
        <div class="col-md-8">
            <div class="col-md-4"></div>
            <div class="col-md-8">
                <div class="row">
                    <form class="form-horizontal" id="urlform">
                        <div class="input-group">
                            <input type="text" class="form-control" id="bitcoinurl" name="bitcoinurl" placeholder="Payment URL">
                            <span class="input-group-btn">
                            <button id="submiturl" class="btn btn-secondary" type="submit">Go!</button>
                        </span>
                        </div>
                        <div class="form-group">
                        </div>
                    </form>
                </div>
            </div>
        </div>

    </div>
</div> <!-- /container -->

<div class="row">
    <div class="col-md-3">
        <div class="row">
            <a id="qrurl">
                <img id="qr" />
            </a>
        </div>
        <div class="row">
            <div id="qrerror">
            </div>
        </div>
    </div>
    <div class="col-md-9">
        <div class="container">
            <div class="row" id="details">

            </div>
        </div>

    </div>
</div>

<!-- Bootstrap core JavaScript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->
<script src="js/app.js" type="text/javascript"></script>

</body>
</html>
